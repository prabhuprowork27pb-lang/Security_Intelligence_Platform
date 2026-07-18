import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildRuleBasedInsights } from "../_shared/ruleBasedInsights.ts";


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
    if (!assessment_id || typeof assessment_id !== 'string') {
      return new Response(JSON.stringify({ error: 'assessment_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use service role for database operations
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ownership check: user must own the assessment or be admin. Return an
    // identical 403 for both "missing" and "forbidden" to prevent enumeration.
    const denied = new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    const [{ data: ownerRow }, { data: isAdminRow }] = await Promise.all([
      supabase.from('assessments').select('user_id').eq('id', assessment_id).maybeSingle(),
      supabaseAuth.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
    ]);
    if (!ownerRow || (ownerRow.user_id !== user.id && !isAdminRow)) {
      return denied;
    }

    // Fetch all question responses for this assessment
    const { data: responses, error: responsesError } = await supabase
      .from('question_responses')
      .select('*')
      .eq('assessment_id', assessment_id);

    if (responsesError) throw responsesError;

    // Define domain keys
    const domainKeys = [
      'SITE_CONTEXT',
      'GOVERNANCE',
      'PERIMETER',
      'VISITORS',
      'GUARDS',
      'ELECTRONIC',
      'INCIDENTS',
      'CULTURE',
      'BCP',
      'COMPLIANCE'
    ];

    const domainNames: Record<string, string> = {
      'SITE_CONTEXT': 'Site Profile & Risk Context',
      'GOVERNANCE': 'Governance, Policy & Security Organisation',
      'PERIMETER': 'Perimeter, Access Control & Physical Infrastructure',
      'VISITORS': 'Visitor, Vendor & Contractor Management',
      'GUARDS': 'Guarding Operations & Statutory Compliance',
      'ELECTRONIC': 'Electronic Security Systems (CCTV, ACS, IDS & Integration)',
      'INCIDENTS': 'Incident Management, SOC & Monitoring',
      'CULTURE': 'Employee Security Culture, Awareness & Behaviour',
      'BCP': 'Business Continuity, Emergency Response & Crisis Management',
      'COMPLIANCE': 'Compliance, Documentation & Third-Party Risk'
    };

    const domainWeights: Record<string, number> = {
      'SITE_CONTEXT': 0.08,
      'GOVERNANCE': 0.10,
      'PERIMETER': 0.12,
      'VISITORS': 0.10,
      'GUARDS': 0.15,
      'ELECTRONIC': 0.12,
      'INCIDENTS': 0.12,
      'CULTURE': 0.08,
      'BCP': 0.08,
      'COMPLIANCE': 0.15
    };

    // Calculate domain scores
    const domainScores = [];
    let weightedScoreSum = 0;
    let totalWeight = 0;

    for (const domainKey of domainKeys) {
      const domainResponses = responses.filter(r => r.domain_key === domainKey);
      
      if (domainResponses.length === 0) continue;

      const sum = domainResponses.reduce((acc, r) => acc + r.rating_0_4, 0);
      const rawScore = sum / domainResponses.length; // 0-4 scale from DB
      const score0to100 = (rawScore / 4) * 100; // Convert 0-4 to 0-100
      
      // Convert 0-4 to 1-5 scale for maturity calculation
      const rawScore1to5 = rawScore + 1;
      let maturity = 1;
      if (rawScore1to5 > 1.8) maturity = 2;
      if (rawScore1to5 > 2.6) maturity = 3;
      if (rawScore1to5 > 3.4) maturity = 4;
      if (rawScore1to5 > 4.2) maturity = 5;

      domainScores.push({
        assessment_id,
        domain_key: domainKey,
        domain_name: domainNames[domainKey],
        score_raw_0_4: rawScore,
        score_0_100: score0to100,
        maturity_1_5: maturity
      });

      // Add weighted contribution to overall score
      const weight = domainWeights[domainKey] || 0.1;
      weightedScoreSum += score0to100 * weight;
      totalWeight += weight;
    }

    // Calculate weighted overall score
    const overallScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;
    const overallRaw1to5 = (overallScore / 100) * 4 + 1; // Convert 0-100 to 1-5 scale for maturity
    
    let overallMaturity = 1;
    if (overallRaw1to5 > 1.8) overallMaturity = 2;
    if (overallRaw1to5 > 2.6) overallMaturity = 3;
    if (overallRaw1to5 > 3.4) overallMaturity = 4;
    if (overallRaw1to5 > 4.2) overallMaturity = 5;

    let riskPosture = "High Risk";
    if (overallScore > 40) riskPosture = "Developing";
    if (overallScore > 60) riskPosture = "Maturing";
    if (overallScore > 75) riskPosture = "Resilient";

    // Delete existing domain scores
    await supabase
      .from('domain_scores')
      .delete()
      .eq('assessment_id', assessment_id);

    // Insert new domain scores
    if (domainScores.length > 0) {
      const { error: domainError } = await supabase
        .from('domain_scores')
        .insert(domainScores);

      if (domainError) throw domainError;
    }

    // Update assessment with overall scores
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        overall_score_0_100: overallScore,
        overall_maturity_1_5: overallMaturity,
        risk_posture: riskPosture,
        status: 'completed'
      })
      .eq('id', assessment_id);

    if (updateError) throw updateError;

    // Rule-based report content — zero AI dependency, always succeeds.
    // Writes to the same columns generate-insights writes to, so any later
    // successful AI run may overwrite it; if AI fails or is skipped, the
    // report still has complete content.
    try {
      const { data: siteRow } = await supabase
        .from('assessments')
        .select('sites(name, site_type, city)')
        .eq('id', assessment_id)
        .maybeSingle();
      const site = (siteRow as any)?.sites ?? {};
      const insights = buildRuleBasedInsights(
        domainScores.map(d => ({
          domain_key: d.domain_key,
          domain_name: d.domain_name,
          score_0_100: d.score_0_100,
          maturity_1_5: d.maturity_1_5,
        })),
        {
          site_name: site?.name,
          site_type: site?.site_type,
          city: site?.city,
          overall_score_0_100: overallScore,
          overall_maturity_1_5: overallMaturity,
          risk_posture: riskPosture,
        },
      );
      await supabase
        .from('assessments')
        .update({
          executive_summary: insights.executive_summary,
          remediation_plan: JSON.stringify(insights),
          review_status: 'report_ready',
          report_ready_at: new Date().toISOString(),
        })
        .eq('id', assessment_id);
      console.log('Rule-based insights saved for', assessment_id);
    } catch (ruleErr) {
      console.error('Rule-based insights generation failed (non-blocking):', ruleErr);
    }


    // RC-03: server-side chain into report generation so the pipeline does not
    // depend on the browser staying open. generate-report-on-submit is
    // idempotent (short-circuits when report_status is already generating/
    // pending_review/approved/sent), so the wizard's fire-and-forget invoke
    // remains safe as a redundant trigger.
    try {
      await fetch(`${supabaseUrl}/functions/v1/generate-report-on-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ assessment_id }),
      }).catch((e) => console.error('generate-report-on-submit chain failed:', e));
    } catch (chainErr) {
      console.error('generate-report-on-submit chain threw:', chainErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        overall_score: overallScore,
        risk_posture: riskPosture 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );


  } catch (error) {
    console.error('Error calculating scores:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
