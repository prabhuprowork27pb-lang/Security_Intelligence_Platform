import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// TODO before launch: replace '*' with 'https://yourdomain.com'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiter: 10 requests / 60 s per authenticated user.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

const sanitize = (v: unknown, n: number): string =>
  typeof v === 'string' ? v.slice(0, n).replace(/[<>"'`]/g, '') : '';

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

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests, please slow down and try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { question, assessment } = await req.json();

    // Input validation to prevent AI credit abuse
    if (typeof question !== 'string' || question.length === 0 || question.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Invalid question: must be a non-empty string under 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!assessment || typeof assessment !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid assessment payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    assessment.executive_summary = sanitize(assessment.executive_summary, 3000);
    assessment.remediation_plan = sanitize(assessment.remediation_plan, 3000);
    assessment.signature_finding = sanitize(assessment.signature_finding, 500);
    assessment.risk_posture = sanitize(assessment.risk_posture, 50);
    if (assessment.site && typeof assessment.site === 'object') {
      assessment.site.name = sanitize(assessment.site.name, 200);
      assessment.site.city = sanitize(assessment.site.city, 100);
      assessment.site.site_type = sanitize(assessment.site.site_type, 100);
      assessment.site.criticality = sanitize(assessment.site.criticality, 50);
      assessment.site.headcount_band = sanitize(assessment.site.headcount_band, 50);
    }
    const overallScoreNum = Number(assessment.overall_score);
    assessment.overall_score = Number.isFinite(overallScoreNum)
      ? Math.max(0, Math.min(100, Math.round(overallScoreNum)))
      : 0;
    const maturityNum = Number(assessment.maturity);
    assessment.maturity = Number.isFinite(maturityNum)
      ? Math.max(1, Math.min(5, Math.round(maturityNum)))
      : 1;
    if (!Array.isArray(assessment.domain_scores)) assessment.domain_scores = [];
    assessment.domain_scores = assessment.domain_scores.slice(0, 20).map((d: any) => {
      const score = Number(d?.score_0_100);
      const maturity = Number(d?.maturity_1_5);
      return {
        domain_name: sanitize(d?.domain_name, 100),
        score_0_100: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
        maturity_1_5: Number.isFinite(maturity) ? Math.max(1, Math.min(5, Math.round(maturity))) : 1,
      };
    });

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const siteContext = assessment.site ?
      `Site: ${assessment.site.name || 'N/A'} in ${assessment.site.city || 'N/A'}
Type: ${assessment.site.site_type || 'N/A'}, Criticality: ${assessment.site.criticality || 'N/A'}, Size: ${assessment.site.headcount_band || 'N/A'}` : '';

    const context = `You are a Principal Security Consultant with 20 years of hands-on experience in corporate physical security for Indian IT/ITES offices, GCCs, BPOs, and financial services organisations in Bengaluru, Mumbai, Pune, Delhi NCR, Hyderabad, and Chennai.

Your expertise spans:
- PSARA 2005 compliance and guarding operations
- Principal employer liability under Indian labour codes
- DPDP Act 2023 physical security implications
- CCTV, access control, and integrated security system design
- ISO 27001, SOC 2, and client security audit preparation
- Security vendor selection, contract structuring, and performance management
- Cost-effective control design for mid-market Indian corporate offices

Your communication style:
- Speak as a practitioner, not a policy document
- Use consulting language where it adds precision: "control design", "operating effectiveness", "principal employer liability", "current-state gap"
- Be direct. If something is a problem, say it is a problem.
- Provide specific, actionable guidance — never generic best practices
- Reference Indian regulatory requirements, local market norms, and cost realities when giving advice
- If a question touches on statutory compliance, flag the legal dimension specifically and recommend the client verify with a labour law specialist

Current Assessment Context:
${siteContext}

Overall Security Score: ${assessment.overall_score}/100
Risk Posture: ${assessment.risk_posture}
Maturity Level: ${assessment.maturity}/5

Domain Scores:
${assessment.domain_scores.map((d: any) => `- ${d.domain_name}: ${Number(d.score_0_100).toFixed(0)}/100 (Maturity ${d.maturity_1_5}/5)`).join('\n')}
${assessment.signature_finding ? `\nSignature Finding for this site: "${assessment.signature_finding}"` : ''}


${assessment.executive_summary ? `\nExecutive Summary:\n${assessment.executive_summary}` : ''}

${assessment.remediation_plan ? `\nRemediation Roadmap:\n${assessment.remediation_plan}` : ''}

Guidance:
- Answer based on the assessment data above
- Be specific, practical, and direct
- Reference actual domain scores when discussing trade-offs
- Keep responses under 350 words unless depth is explicitly requested
- When giving recommendations, specify the owner, timeframe, and success indicator`;

    let answer: string;
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: question },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      answer = data.choices[0].message.content;
    } catch (aiError) {
      console.error('[ask-saass] AI gateway failure:', aiError);
      return new Response(
        JSON.stringify({ error: 'Could not get a response. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ask-saass:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
