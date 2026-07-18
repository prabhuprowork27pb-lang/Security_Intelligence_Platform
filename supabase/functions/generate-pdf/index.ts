import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO before launch: replace '*' with 'https://yourdomain.com'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { assessment_id } = await req.json();

    if (!assessment_id) {
      return new Response(
        JSON.stringify({ error: "assessment_id is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Generating PDF for assessment: ${assessment_id}`);

    // Use service role for database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch assessment data to verify it exists
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*, sites(name, city, state, organisations(name))')
      .eq('id', assessment_id)
      .single();

    // Ownership check
    const { data: isAdminRow } = await supabaseAuth.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (assessment && assessment.user_id !== user.id && !isAdminRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (assessmentError || !assessment) {
      console.error('Error fetching assessment:', assessmentError);
      return new Response(
        JSON.stringify({ error: 'Assessment not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    console.log(`Successfully verified assessment ${assessment_id}`);
    
    // Get the app URL from environment or construct from Supabase URL
    const supabaseProjectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)?.[1];
    const baseUrl = Deno.env.get('APP_URL') || `https://${supabaseProjectRef}.lovableproject.com`;
    const reportUrl = `${baseUrl}/pdf-report?id=${assessment_id}`;

    console.log(`Report URL: ${reportUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "PDF report page ready",
        pdf_url: reportUrl,
        instructions: "Open this URL and use Ctrl+P (or Cmd+P on Mac) to save as PDF. The page includes print-optimized styling.",
        assessment_id: assessment_id,
        site_name: assessment.sites?.name || "Assessment",
        organisation: assessment.sites?.organisations?.name || "",
        tips: [
          "Use 'Save as PDF' option in the print dialog",
          "Enable 'Background graphics' for colored elements",
          "Set margins to 'Default' or 'Minimum'",
          "Use A4 Portrait orientation"
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate PDF',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
