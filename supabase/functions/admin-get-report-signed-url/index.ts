import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const userClient = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  })
  const { data: userData } = await userClient.auth.getUser()
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' })
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let body: { assessment_id?: string; download?: boolean; history_path?: string }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  if (!body.assessment_id) {
    return new Response(JSON.stringify({ error: 'assessment_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: assessment } = await admin
    .from('assessments')
    .select('id, report_pdf_path, report_version')
    .eq('id', body.assessment_id)
    .maybeSingle()
  if (!assessment) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const path = body.history_path ?? (assessment as any).report_pdf_path
  if (!path) {
    return new Response(JSON.stringify({ error: 'No PDF available' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: signed, error } = await admin.storage
    .from('reports')
    .createSignedUrl(path, 60 * 15, body.download ? { download: true } : undefined)
  if (error || !signed?.signedUrl) {
    return new Response(JSON.stringify({ error: error?.message ?? 'sign failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  await admin.from('report_audit_log').insert({
    assessment_id: body.assessment_id,
    actor_user_id: userData.user.id,
    actor_label: 'admin',
    action: body.download ? 'downloaded' : 'previewed',
    report_version: (assessment as any).report_version ?? 1,
    metadata: { path },
  })

  return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
