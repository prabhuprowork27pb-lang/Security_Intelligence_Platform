import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const MAX_ATTEMPTS = 5

function band(score: number): string {
  if (score <= 40) return 'Ad Hoc'
  if (score <= 70) return 'Developing'
  if (score <= 85) return 'Managed'
  return 'Resilient'
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
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const user = userData.user
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { assessment_id?: string; version?: number; force_resend?: boolean }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const assessmentId = body.assessment_id
  if (!assessmentId) {
    return new Response(JSON.stringify({ error: 'assessment_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: assessment } = await admin
    .from('assessments')
    .select('id, user_id, overall_score_0_100, report_pdf_path, report_status, report_version, report_email_attempts, sites(name)')
    .eq('id', assessmentId)
    .maybeSingle()
  if (!assessment) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!(assessment as any).report_pdf_path) {
    return new Response(JSON.stringify({ error: 'Report not generated yet' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const currentVersion = Number((assessment as any).report_version ?? 1)
  if (body.version != null && body.version !== currentVersion) {
    return new Response(JSON.stringify({ error: `Stale version (latest is v${currentVersion})` }), {
      status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const attempts = Number((assessment as any).report_email_attempts ?? 0)
  if (attempts >= MAX_ATTEMPTS) {
    return new Response(JSON.stringify({ error: `Email retry cap reached (${MAX_ATTEMPTS}). Contact recipient manually.` }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const isRetry = body.force_resend === true || (assessment as any).report_status === 'email_failed' || (assessment as any).report_status === 'sent'

  const { data: profile } = await admin
    .from('profiles').select('email, full_name').eq('user_id', (assessment as any).user_id!).maybeSingle()
  const { data: authUser } = await admin.auth.admin.getUserById((assessment as any).user_id!)
  const recipientEmail = profile?.email ?? authUser?.user?.email
  const recipientName = profile?.full_name ?? null
  if (!recipientEmail) {
    return new Response(JSON.stringify({ error: 'No recipient email on file' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // RC-03: email is a notification only — it must not carry the PDF or a
  // signed URL. Recipients sign in to the SIP Command Centre to download
  // their report (the app uses get-report-download-url for fresh, short-
  // lived links).
  const siteName = (assessment as any).sites?.name ?? null
  const nextAttempt = attempts + 1
  const idempotencyKey = `report-ready-${assessmentId}-v${currentVersion}-${nextAttempt}`

  const sendResp = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE}` },
    body: JSON.stringify({
      templateName: 'report-ready',
      recipientEmail,
      idempotencyKey,
      templateData: { recipientName, siteName },
    }),
  })
  if (!sendResp.ok) {
    const t = await sendResp.text()
    console.error('send-transactional-email failed', sendResp.status, t)
    await admin.from('assessments').update({
      report_status: 'email_failed',
      report_error: t.slice(0, 500),
      report_email_attempts: nextAttempt,
    }).eq('id', assessmentId)
    await admin.from('report_audit_log').insert({
      assessment_id: assessmentId,
      actor_user_id: user.id,
      actor_label: 'admin',
      action: 'email_failed',
      report_version: currentVersion,
      metadata: { http_status: sendResp.status, error: t.slice(0, 500), attempt: nextAttempt },
    })
    return new Response(JSON.stringify({ error: `Email send failed: ${t.slice(0, 200)}` }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  await admin
    .from('assessments')
    .update({
      report_status: 'sent',
      report_approved_by: user.id,
      report_approved_at: new Date().toISOString(),
      report_sent_at: new Date().toISOString(),
      report_email_attempts: nextAttempt,
      report_error: null,
      review_status: 'report_ready',
      report_ready_at: new Date().toISOString(),
    } as any)
    .eq('id', assessmentId)

  await admin.from('report_audit_log').insert({
    assessment_id: assessmentId,
    actor_user_id: user.id,
    actor_label: 'admin',
    action: isRetry ? 'email_retried' : 'approved',
    report_version: currentVersion,
    metadata: { recipient: recipientEmail, attempt: nextAttempt, idempotency_key: idempotencyKey },
  })

  return new Response(JSON.stringify({ success: true, attempt: nextAttempt }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
