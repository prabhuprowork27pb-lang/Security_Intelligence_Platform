// Generate Validated Intelligence Report.
//
// Two modes:
//   - mode:"sweep" (cron, authenticated by CRON_SECRET): scans for assessments
//     whose Quick Report is older than 23h and Validated Report still pending,
//     then auto-generates and releases them.
//   - mode:"single" + assessment_id (admin user JWT): generates and releases
//     immediately on admin demand.
//
// The function calls Lovable AI (Gemini 3 Flash) with a structured Output.object
// schema to produce: specialist commentary on weak domains, regulatory
// alignment table, peer benchmark, and prioritised findings with investment
// estimates.
//
// On success: persists validated_report_payload, sets status='ready',
// writes report_audit_log, and (if a WhatsApp number is on file and
// GATEWAYAPI_API_KEY is configured) sends a WhatsApp notification.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@0.0.18'
import { generateText, Output } from 'npm:ai@3.4.33'
import { z } from 'npm:zod@3.23.8'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const GATEWAYAPI_API_KEY = Deno.env.get('GATEWAYAPI_API_KEY')

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

// ---- AI provider ----
function aiModel() {
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing')
  const provider = createOpenAICompatible({
    name: 'lovable-gateway',
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    headers: { 'Lovable-API-Key': LOVABLE_API_KEY },
  })
  return provider('google/gemini-3-flash-preview')
}

const ValidatedSchema = z.object({
  specialist_commentary: z.array(z.object({
    domain: z.string(),
    score: z.number(),
    commentary: z.string(),
  })),
  regulatory_alignment: z.array(z.object({
    standard: z.string(),
    applies: z.boolean(),
    status: z.enum(['compliant', 'gap', 'partial', 'not_applicable']),
    note: z.string(),
  })),
  peer_benchmark: z.object({
    archetype: z.string(),
    site_score: z.number(),
    peer_median: z.number(),
    peer_p25: z.number(),
    peer_p75: z.number(),
    sample_size: z.number(),
    sample_note: z.string(),
    narrative: z.string(),
  }),
  priority_findings: z.array(z.object({
    code: z.string(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    title: z.string(),
    evidence: z.string(),
    action_30d: z.string(),
    investment_inr_min: z.number(),
    investment_inr_max: z.number(),
  })),
})

// ---- Peer baseline lookup ----
const BASELINES: Record<string, { archetype: string; median: number; p25: number; p75: number }> = {
  it_ites_campus: { archetype: 'IT / ITES Campus', median: 68, p25: 54, p75: 78 },
  bfsi_branch: { archetype: 'BFSI Branch', median: 71, p25: 58, p75: 82 },
  manufacturing_plant: { archetype: 'Manufacturing Plant', median: 62, p25: 48, p75: 74 },
  retail_store: { archetype: 'Retail Store / Mall', median: 58, p25: 44, p75: 70 },
  warehouse_logistics: { archetype: 'Warehouse / Logistics', median: 55, p25: 42, p75: 68 },
  hospitality: { archetype: 'Hospitality / Hotel', median: 64, p25: 52, p75: 75 },
  healthcare: { archetype: 'Healthcare / Hospital', median: 61, p25: 48, p75: 73 },
  data_centre: { archetype: 'Data Centre', median: 77, p25: 65, p75: 87 },
  default: { archetype: 'All India sites', median: 63, p25: 50, p75: 75 },
}
function baselineFor(siteType: string | null | undefined) {
  if (!siteType) return BASELINES.default
  const k = siteType.toLowerCase().replace(/[^a-z]+/g, '_')
  return BASELINES[k] ?? BASELINES.default
}

async function computePeerStats(siteType: string | null, city: string | null, score: number) {
  // Try real peers (same city + similar site type) first.
  let realCount = 0
  let realMedian = 0
  try {
    const { data } = await admin
      .from('assessments')
      .select('overall_score_0_100, sites!inner(city, site_type)')
      .eq('sites.city', city ?? '')
      .eq('sites.site_type', siteType ?? '')
      .not('overall_score_0_100', 'is', null)
      .limit(200)
    const scores = (data ?? [])
      .map((r: any) => Number(r.overall_score_0_100))
      .filter((n: number) => !Number.isNaN(n))
    realCount = scores.length
    if (realCount > 0) {
      const sorted = [...scores].sort((a, b) => a - b)
      realMedian = sorted[Math.floor(sorted.length / 2)]
    }
  } catch (e) {
    console.warn('peer lookup failed', e)
  }

  if (realCount >= 5) {
    const sorted = [...Array(realCount).keys()] // placeholder, recompute below
    const { data } = await admin
      .from('assessments')
      .select('overall_score_0_100, sites!inner(city, site_type)')
      .eq('sites.city', city ?? '')
      .eq('sites.site_type', siteType ?? '')
      .not('overall_score_0_100', 'is', null)
    const scores = ((data ?? []) as any[])
      .map((r) => Number(r.overall_score_0_100))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b)
    return {
      archetype: `${siteType ?? 'Site'} · ${city ?? 'India'}`,
      median: scores[Math.floor(scores.length / 2)],
      p25: scores[Math.floor(scores.length * 0.25)],
      p75: scores[Math.floor(scores.length * 0.75)],
      sample_size: scores.length,
      sample_note: `Compared against ${scores.length} peer sites in ${city ?? 'India'}.`,
    }
  }

  const b = baselineFor(siteType)
  return {
    archetype: b.archetype,
    median: b.median,
    p25: b.p25,
    p75: b.p75,
    sample_size: realCount,
    sample_note: realCount > 0
      ? `Only ${realCount} live peers — using SIP™ India ${b.archetype} baseline.`
      : `SIP™ India ${b.archetype} baseline (curated by SIP™ Advisory Team).`,
  }
}

async function maybeSendWhatsApp(mobile: string | null, siteName: string) {
  if (!mobile || !GATEWAYAPI_API_KEY || !LOVABLE_API_KEY) return { sent: false, reason: 'skipped' }
  const digits = String(mobile).replace(/\D/g, '')
  if (digits.length < 10) return { sent: false, reason: 'invalid_mobile' }
  const recipient = digits.length === 10 ? Number(`91${digits}`) : Number(digits)
  try {
    const r = await fetch('https://connector-gateway.lovable.dev/gatewayapi/mobile/single', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GATEWAYAPI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: 'SIPnotify',
        recipient,
        message: `SIP™: Your Validated Intelligence Report for ${siteName} is now ready in your Command Centre.`,
      }),
    })
    if (!r.ok) return { sent: false, reason: `gateway_${r.status}` }
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: String(e).slice(0, 120) }
  }
}

async function processOne(assessmentId: string, actor: 'admin' | 'auto' | 'auto_escalated', actorUserId?: string) {
  const { data: a } = await admin
    .from('assessments')
    .select('id, user_id, overall_score_0_100, executive_summary, remediation_plan, validated_report_status, sites(name, city, site_type)')
    .eq('id', assessmentId)
    .maybeSingle()
  if (!a) return { ok: false, error: 'not_found' }
  if ((a as any).validated_report_status === 'ready') return { ok: true, skipped: 'already_ready' }

  await admin.from('assessments').update({ validated_report_status: 'generating', validated_report_error: null }).eq('id', assessmentId)

  try {
    const { data: domains } = await admin
      .from('domain_scores').select('domain_key, score_0_100').eq('assessment_id', assessmentId)
    const weakDomains = (domains ?? []).filter((d: any) => Number(d.score_0_100) < 70)

    const peer = await computePeerStats(
      (a as any).sites?.site_type ?? null,
      (a as any).sites?.city ?? null,
      Number((a as any).overall_score_0_100 ?? 0),
    )

    const siteName = (a as any).sites?.name ?? 'Site'
    const score = Number((a as any).overall_score_0_100 ?? 0)

    const prompt = `You are a senior physical-security consultant on the SIP™ Advisory Team with 20+ years of Indian field experience (IT/ITES, BFSI, manufacturing).
Generate the Validated Intelligence Report enrichment for site "${siteName}" (overall score ${score}/100, site type "${(a as any).sites?.site_type ?? 'unknown'}", city "${(a as any).sites?.city ?? 'India'}").

Weak domains (<70):
${JSON.stringify(weakDomains)}

Executive summary so far:
${((a as any).executive_summary ?? '').slice(0, 1500)}

Peer benchmark numbers to incorporate verbatim (do not invent your own):
- archetype: "${peer.archetype}"
- peer_median: ${peer.median}
- peer_p25: ${peer.p25}
- peer_p75: ${peer.p75}
- sample_size: ${peer.sample_size}
- sample_note: "${peer.sample_note}"

Produce structured JSON matching the schema:
1. specialist_commentary: 2-3 sentences per weak domain rooted in Indian field experience (PSARA, shift rosters, monsoon, vendor lead times).
2. regulatory_alignment: rows for "PSARA", "DPDP Act 2023", "ISO 18788", "Labour Codes 2020" — set applies/status/note honestly given the score profile.
3. peer_benchmark: use the numbers above; write a one-paragraph narrative comparing this site to peers.
4. priority_findings: 4-6 findings coded F-01, F-02, ... in descending severity. Each with concrete 30-day action and indicative INR investment range (be realistic for Indian market).
Be specific, avoid generic advice, never repeat the same finding twice.`

    const { experimental_output: output } = await generateText({
      model: aiModel(),
      experimental_output: Output.object({ schema: ValidatedSchema }),
      prompt,
    })

    // Override the peer numbers to keep them authoritative
    const payload = {
      ...output,
      peer_benchmark: {
        ...output.peer_benchmark,
        archetype: peer.archetype,
        site_score: score,
        peer_median: peer.median,
        peer_p25: peer.p25,
        peer_p75: peer.p75,
        sample_size: peer.sample_size,
        sample_note: peer.sample_note,
      },
      generated_at: new Date().toISOString(),
      engine: 'sip-advisory-engine-v1',
    }

    await admin.from('assessments').update({
      validated_report_status: 'ready',
      validated_report_ready_at: new Date().toISOString(),
      validated_report_generated_by: actor,
      validated_reviewer_name: 'SIP™ Advisory Team',
      validated_report_payload: payload,
      validated_report_error: null,
      validated_share_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', assessmentId)

    await admin.from('report_audit_log').insert({
      assessment_id: assessmentId,
      actor_user_id: actorUserId ?? null,
      actor_label: actor === 'admin' ? 'admin' : 'system',
      action: actor === 'auto_escalated' ? 'validated_auto_escalated' : 'validated_ready',
      metadata: { generated_by: actor, findings_count: output.priority_findings.length },
    })

    // WhatsApp notification (best-effort)
    const { data: profile } = await admin
      .from('profiles').select('mobile').eq('user_id', (a as any).user_id).maybeSingle()
    const wa = await maybeSendWhatsApp((profile as any)?.mobile ?? null, siteName)
    if (wa.sent) {
      await admin.from('report_audit_log').insert({
        assessment_id: assessmentId,
        actor_label: 'system',
        action: 'validated_whatsapp_sent',
        metadata: { recipient_masked: ((profile as any)?.mobile ?? '').slice(-4) },
      })
    }

    return { ok: true, assessment_id: assessmentId, whatsapp: wa.sent }
  } catch (e) {
    console.error('Validated generation failed', assessmentId, e)
    await admin.from('assessments').update({
      validated_report_status: 'failed',
      validated_report_error: String(e).slice(0, 500),
    }).eq('id', assessmentId)
    await admin.from('report_audit_log').insert({
      assessment_id: assessmentId,
      actor_label: 'system',
      action: 'validated_failed',
      metadata: { error: String(e).slice(0, 500) },
    })
    return { ok: false, error: String(e).slice(0, 200) }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let body: any = {}
  try { body = await req.json() } catch { /* no body */ }
  const mode = body?.mode ?? 'single'
  const auth = req.headers.get('Authorization') ?? ''

  // ---- Sweep (cron) ----
  if (mode === 'sweep') {
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized cron' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    const { data: pending } = await admin
      .from('assessments')
      .select('id')
      .eq('validated_report_status', 'pending')
      .not('report_ready_at', 'is', null)
      .lt('report_ready_at', cutoff)
      .limit(10)
    const results = []
    for (const row of pending ?? []) {
      results.push(await processOne((row as any).id, 'auto_escalated'))
    }
    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ---- Single (admin) ----
  if (!auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const userClient = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  })
  const { data: userData, error: uErr } = await userClient.auth.getUser()
  if (uErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' })
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const assessmentId = body?.assessment_id
  if (!assessmentId) {
    return new Response(JSON.stringify({ error: 'assessment_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const result = await processOne(assessmentId, 'admin', userData.user.id)
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
