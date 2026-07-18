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

  let body: { assessment_id?: string; download?: boolean }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  if (!body.assessment_id) {
    return new Response(JSON.stringify({ error: 'assessment_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data: a } = await admin
    .from('assessments')
    .select('id, user_id, report_status, report_pdf_path')
    .eq('id', body.assessment_id)
    .maybeSingle()
  if (!a) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  if ((a as any).user_id !== userData.user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  if ((a as any).report_status !== 'sent') {
    return new Response(JSON.stringify({ error: 'Report not yet released' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  if (!(a as any).report_pdf_path) {
    return new Response(JSON.stringify({ error: 'No PDF available' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: signed, error } = await admin.storage
    .from('reports')
    .createSignedUrl((a as any).report_pdf_path, 60 * 30, body.download ? { download: true } : undefined)
  if (error || !signed?.signedUrl) {
    return new Response(JSON.stringify({ error: error?.message ?? 'sign failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
