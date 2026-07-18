import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

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
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data: isAdmin } = await admin.rpc('has_role', {
    _user_id: userData.user.id, _role: 'admin',
  })
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/pulse-ingest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_ROLE}` },
  })
  const text = await resp.text()
  return new Response(text, {
    status: resp.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
