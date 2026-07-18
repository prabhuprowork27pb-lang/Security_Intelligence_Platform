import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

function band(score: number): string {
  if (score <= 40) return 'Ad Hoc (Red)'
  if (score <= 70) return 'Developing (Amber)'
  if (score <= 85) return 'Managed (Teal)'
  return 'Resilient (Green)'
}

async function invokeFn(name: string, auth: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
      apikey: ANON,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let parsed: any = null
  try { parsed = text ? JSON.parse(text) : null } catch { /* ignore */ }
  if (!res.ok) {
    const msg = parsed?.error || text || `${name} failed (${res.status})`
    throw new Error(`${name}: ${msg}`)
  }
  return parsed
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  })
  const { data: userData } = await userClient.auth.getUser()
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const user = userData.user

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data: isAdminRow } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
  if (!isAdminRow) {
    return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { assessment_id?: string }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const assessmentId = body.assessment_id
  if (!assessmentId || typeof assessmentId !== 'string') {
    return new Response(JSON.stringify({ error: 'assessment_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Snapshot previous state for audit
  const { data: before } = await admin
    .from('assessments')
    .select('id, overall_score_0_100, report_status, report_pdf_path, report_version, report_generated_at, sites(name, organisations(name))')
    .eq('id', assessmentId)
    .maybeSingle()
  if (!before) {
    return new Response(JSON.stringify({ error: 'Assessment not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const previousScore = (before as any).overall_score_0_100
  const previousStatus = (before as any).report_status
  const previousGeneratedAt = (before as any).report_generated_at
  const existingPath: string | null = (before as any).report_pdf_path ?? null
  const version = Number((before as any).report_version ?? 1) || 1

  try {
    // 1) Recalculate scores from current question_responses
    await invokeFn('calculate-scores', auth, { assessment_id: assessmentId })

    // 2) Regenerate insights with the upgraded prompt
    await invokeFn('generate-insights', auth, { assessment_id: assessmentId })

    // 3) Re-render PDF and overwrite at the existing storage path (no version bump)
    const { data: refreshed } = await admin
      .from('assessments')
      .select('id, overall_score_0_100, sites(name, organisations(name))')
      .eq('id', assessmentId)
      .maybeSingle()
    const newScore = (refreshed as any)?.overall_score_0_100 ?? previousScore ?? 0

    const { data: domains } = await admin
      .from('domain_scores').select('*').eq('assessment_id', assessmentId)

    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)
    const navy = rgb(0.05, 0.087, 0.165)
    const azure = rgb(0.094, 0.466, 0.949)
    const slate = rgb(0.2, 0.235, 0.31)

    const cover = pdf.addPage([595, 842])
    cover.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: navy })
    cover.drawText('Security Intelligence Platform™', { x: 40, y: 800, size: 16, font: boldFont, color: rgb(1,1,1) })
    cover.drawText('SIP™ · Structured · Intelligent · Practicable', { x: 40, y: 780, size: 9, font, color: rgb(0.8,0.85,0.95) })
    cover.drawText('Security Selfie™ — Diagnostic Report', { x: 40, y: 680, size: 22, font: boldFont, color: navy })
    const siteName = (refreshed as any)?.sites?.name ?? (before as any)?.sites?.name ?? 'Site'
    const orgName = (refreshed as any)?.sites?.organisations?.name ?? (before as any)?.sites?.organisations?.name ?? ''
    cover.drawText(siteName, { x: 40, y: 645, size: 16, font: boldFont, color: slate })
    if (orgName) cover.drawText(orgName, { x: 40, y: 625, size: 12, font, color: slate })

    cover.drawText('Overall maturity score', { x: 40, y: 560, size: 10, font: boldFont, color: slate })
    cover.drawText(`${Math.round(Number(newScore))} / 100`, { x: 40, y: 530, size: 36, font: boldFont, color: azure })
    cover.drawText(band(Number(newScore)), { x: 40, y: 505, size: 12, font, color: slate })

    cover.drawText('QA backfill regeneration · internal review', { x: 40, y: 478, size: 9, font: boldFont, color: azure })
    cover.drawText(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`, {
      x: 40, y: 60, size: 9, font, color: slate,
    })
    cover.drawText('Confidential · For named recipient only', { x: 40, y: 45, size: 9, font, color: slate })

    const dp = pdf.addPage([595, 842])
    dp.drawText('Domain maturity', { x: 40, y: 790, size: 18, font: boldFont, color: navy })
    dp.drawLine({ start: { x: 40, y: 780 }, end: { x: 555, y: 780 }, thickness: 1, color: azure })
    let y = 755
    const domainList = (domains ?? []) as Array<any>
    if (domainList.length === 0) {
      dp.drawText('Domain breakdown not yet calculated.', { x: 40, y, size: 11, font, color: slate })
    } else {
      for (const d of domainList) {
        if (y < 80) break
        const name = String(d.domain_key ?? d.domain ?? 'Domain').replace(/_/g, ' ')
        const s = Number(d.score_0_100 ?? 0)
        dp.drawText(name, { x: 40, y, size: 11, font: boldFont, color: navy })
        const barW = 280
        dp.drawRectangle({ x: 250, y: y - 2, width: barW, height: 10, color: rgb(0.92,0.94,0.97) })
        dp.drawRectangle({ x: 250, y: y - 2, width: barW * Math.min(1, s / 100), height: 10, color: azure })
        dp.drawText(`${Math.round(s)}`, { x: 540, y, size: 10, font: boldFont, color: navy })
        y -= 22
      }
    }

    const cp = pdf.addPage([595, 842])
    cp.drawText('Next steps', { x: 40, y: 790, size: 18, font: boldFont, color: navy })
    cp.drawLine({ start: { x: 40, y: 780 }, end: { x: 555, y: 780 }, thickness: 1, color: azure })
    const lines = [
      'This Security Selfie™ is a diagnostic snapshot — a starting point, not a',
      'compliance verdict. Use the domain scores to prioritise where rehearsal,',
      'governance and operational rhythm investments will move the needle.',
      '',
      'For a deeper, evidence-led engagement (Security Studio™), reply to the',
      'notification email or contact us through the platform.',
    ]
    let ly = 750
    for (const ln of lines) { cp.drawText(ln, { x: 40, y: ly, size: 11, font, color: slate }); ly -= 18 }

    const bytes = await pdf.save()
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const path = existingPath ?? `${assessmentId}/security-selfie-v${version}-${yyyymmdd}.pdf`

    const { error: upErr } = await admin.storage.from('reports').upload(path, bytes, {
      contentType: 'application/pdf', upsert: true,
    })
    if (upErr) throw upErr

    await admin
      .from('assessments')
      .update({
        report_status: 'pending_review',
        report_pdf_path: path,
        report_generated_at: new Date().toISOString(),
        report_email_attempts: 0,
        report_error: null,
      })
      .eq('id', assessmentId)

    await admin.from('report_audit_log').insert({
      assessment_id: assessmentId,
      actor_user_id: user.id,
      actor_label: 'admin-backfill',
      action: 'regenerated_for_qa',
      report_version: version,
      metadata: {
        previous_score: previousScore,
        new_score: newScore,
        previous_report_status: previousStatus,
        previous_report_generated_at: previousGeneratedAt,
        pdf_path: path,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      assessment_id: assessmentId,
      previous_score: previousScore,
      new_score: newScore,
      report_pdf_path: path,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = (e as Error).message ?? String(e)
    console.error('admin-regenerate-report failed', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
