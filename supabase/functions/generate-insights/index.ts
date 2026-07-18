import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// TODO before launch: replace '*' with 'https://securityintelplatform.com'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Rating scale ────────────────────────────────────────────────────────────
// DB stores 0–4. UI showed 1–5. The question_responses table stores rating_0_4.
// 0 = unanswered, 1 = Ad-hoc, 2 = Developing, 3 = Defined, 4 = Managed/Resilient
const RATING_LABELS: Record<number, string> = {
  0: "Not assessed",
  1: "Ad-hoc — absent or entirely ad hoc, no documentation",
  2: "Developing — exists in some form but inconsistent or undocumented",
  3: "Defined — documented and mostly followed",
  4: "Managed — consistently applied with measurement",
};

// ─── Consultant memory: patterns seen across hundreds of Indian sites ─────────
// This is injected into the AI as grounded institutional knowledge so it can
// recognise patterns rather than just describe scores.
const CONSULTANT_PATTERN_LIBRARY = `
PATTERN LIBRARY — drawn from 200+ Indian corporate security assessments:

PATTERN 1 — "The Compliance Theatre pattern"
Indicator: Governance scores 3–4, Guarding statutory scores 1–2.
Meaning: The organisation has security policies and committees but has never verified
whether the guarding vendor is actually compliant. Policy exists; reality does not match it.
Language to use: "The programme has the architecture of compliance without its substance."

PATTERN 2 — "The Technology Trap pattern"
Indicator: Electronic Security scores 3–4, Employee Culture scores 1–2, Incident Management 1–2.
Meaning: Significant investment in CCTV and access control, but the systems are not monitored
in real time, logs are not reviewed, and employees bypass controls without consequence.
Language to use: "Technology has been purchased but not operationalised. The cameras record;
nobody watches. The logs exist; nobody reads them."

PATTERN 3 — "The Invisible Contractor pattern"
Indicator: Visitor/Contractor scores 1–2, Guarding scores 2–3, Compliance scores 1–2.
Meaning: Third-party staff — housekeeping, pantry, AMC engineers — have de facto free movement
because familiarity has eroded discipline. These are statistically the highest-risk individuals
on site and the least managed.
Language to use: "The people who clean the server room and service the lifts are less
scrutinised than a first-time visitor. Familiarity has replaced verification."

PATTERN 4 — "The Paper Programme pattern"
Indicator: Governance 3–4, Incidents 1–2, BCP 1–2, Culture 1–2.
Meaning: Documents exist — policies, BCPs, incident response plans — but they have never been
tested. The organisation can produce paperwork for an auditor but cannot respond effectively
to an actual event.
Language to use: "The security programme exists in documents and in the confidence of
leadership. It has not yet been stress-tested by reality."

PATTERN 5 — "The Night Shift Blind Spot pattern"
Indicator: Guarding scores show low attrition monitoring, Incidents show no near-miss capture,
BCP shows no unannounced drill.
Meaning: The security programme is calibrated for normal business hours. After 7pm, guarding
strength drops, monitoring becomes passive, and the organisation's actual vulnerability window
opens. Most Indian office security incidents occur between 10pm and 6am.
Language to use: "The programme is well-calibrated for the hours when the most senior people
are watching. It has not been designed for the hours when it most needs to work."

PATTERN 6 — "The Principal Employer Exposure pattern"
Indicator: GRD01 (PSARA), GRD03 (PF/ESI), GRD04 (wages) all rated 1 or 2.
Meaning: The organisation is at acute statutory risk. Under the Code on Social Security 2020
and Code on Wages 2019, the principal employer carries joint liability for all vendor defaults.
This is not a future risk — it is a current exposure that a single labour department inspection
would reveal.
Language to use: "This is not a compliance gap waiting to become a problem. It is a problem
that has not yet been discovered by an inspector."

PATTERN 7 — "The Leadership Permission pattern"
Indicator: Culture scores show low leadership modelling (CUL06), low tailgating discipline (CUL04),
low reporting mechanism awareness (CUL03).
Meaning: Security culture breaks down from the top. When the CISO or Site Director skips badge
discipline or requests VIP escort exemptions, the signal travels faster than any awareness
training. Every guard and employee observes and replicates.
Language to use: "The security culture reflects the behaviour of the most senior person who
visibly does not follow security protocols. Fix that first."

PATTERN 8 — "The False Assurance pattern"
Indicator: High Electronic Security scores but low log review scores (ELC05), low monitoring
scores (ELC03).
Meaning: The organisation believes it is secure because cameras are present. But cameras that
record without being monitored, and logs that are never reviewed, provide forensic value only —
after an incident has already occurred. They deter opportunistic threats but miss determined ones.
Language to use: "The cameras create the impression of security. The absence of active
monitoring means they are forensic tools, not preventive ones."
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { assessment_id } = await req.json();
    if (!assessment_id || typeof assessment_id !== 'string') {
      return new Response(JSON.stringify({ error: 'assessment_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ownership check — same 403 message whether not found or not owned
    const { data: ownerRow } = await supabase
      .from('assessments').select('user_id').eq('id', assessment_id).single();
    const { data: isAdminRow } = await supabaseAuth.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!ownerRow || (ownerRow.user_id !== user.id && !isAdminRow)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Fetch all data in parallel ────────────────────────────────────────────
    const [assessmentRes, domainScoresRes, responsesRes] = await Promise.all([
      supabase
        .from('assessments')
        .select('*, sites(name, city, site_type, criticality, headcount_band, state)')
        .eq('id', assessment_id)
        .single(),
      supabase
        .from('domain_scores')
        .select('*')
        .eq('assessment_id', assessment_id)
        .order('score_0_100', { ascending: true }),
      // ── THE KEY CHANGE: fetch actual question responses with comments ────────
      supabase
        .from('question_responses')
        .select('question_code, question_text, domain_key, rating_0_4, comment, assessor_comment, evidence_note')
        .eq('assessment_id', assessment_id)
        .order('domain_key', { ascending: true }),
    ]);

    const assessment = assessmentRes.data;
    const domainScores = domainScoresRes.data;
    const allResponses = responsesRes.data || [];

    if (!assessment || !domainScores) {
      throw new Error('Assessment data not found');
    }

    // ── Build the question intelligence layer ─────────────────────────────────
    // Group responses by domain and classify by rating
    const responsesByDomain: Record<string, typeof allResponses> = {};
    for (const r of allResponses) {
      if (!responsesByDomain[r.domain_key]) responsesByDomain[r.domain_key] = [];
      responsesByDomain[r.domain_key].push(r);
    }

    // For each domain: extract critical failures (rating 1), gaps (rating 2),
    // and strengths (rating 4). Include ALL assessor comments verbatim.
    const domainIntelligence = domainScores.map(domain => {
      const responses = responsesByDomain[domain.domain_key] || [];
      const criticalFailures = responses.filter(r => r.rating_0_4 === 1);
      const gaps = responses.filter(r => r.rating_0_4 === 2);
      const strengths = responses.filter(r => r.rating_0_4 === 4);

      // Collect all assessor comments — these are the gold
      const assessorComments = responses
        .filter(r => r.assessor_comment && r.assessor_comment.trim().length > 0)
        .map(r => `[${r.question_code}] "${r.assessor_comment.trim()}"`)
        .join('\n');

      const evidenceNotes = responses
        .filter(r => r.evidence_note && r.evidence_note.trim().length > 0)
        .map(r => `[${r.question_code}] ${r.evidence_note.trim()}`)
        .join('\n');

      const responderComments = responses
        .filter(r => r.comment && r.comment.trim().length > 0)
        .map(r => `[${r.question_code}] "${r.comment.trim()}"`)
        .join('\n');

      return {
        domain_key: domain.domain_key,
        domain_name: domain.domain_name,
        score: domain.score_0_100.toFixed(0),
        maturity: domain.maturity_1_5,
        critical_failures: criticalFailures.map(r => `${r.question_code}: ${r.question_text}`),
        gaps: gaps.map(r => `${r.question_code}: ${r.question_text}`),
        strengths: strengths.map(r => `${r.question_code}: ${r.question_text}`),
        assessor_comments: assessorComments,
        evidence_notes: evidenceNotes,
        responder_comments: responderComments,
        total_questions: responses.length,
        questions_at_1: criticalFailures.length,
        questions_at_2: gaps.length,
        questions_at_3: responses.filter(r => r.rating_0_4 === 3).length,
        questions_at_4: strengths.length,
      };
    });

    // ── Identify cross-domain patterns ────────────────────────────────────────
    const allRatings = allResponses.reduce((acc, r) => {
      acc[r.question_code] = r.rating_0_4;
      return acc;
    }, {} as Record<string, number>);

    // Detect which consultant patterns apply to this specific assessment
    const electronicScore = domainScores.find(d => d.domain_key === 'ELECTRONIC')?.score_0_100 || 0;
    const cultureScore = domainScores.find(d => d.domain_key === 'CULTURE')?.score_0_100 || 0;
    const governanceScore = domainScores.find(d => d.domain_key === 'GOVERNANCE')?.score_0_100 || 0;
    const guardingScore = domainScores.find(d => d.domain_key === 'GUARDS')?.score_0_100 || 0;
    const incidentScore = domainScores.find(d => d.domain_key === 'INCIDENTS')?.score_0_100 || 0;
    const visitorScore = domainScores.find(d => d.domain_key === 'VISITORS')?.score_0_100 || 0;
    const bcpScore = domainScores.find(d => d.domain_key === 'BCP')?.score_0_100 || 0;

    const detectedPatterns: string[] = [];
    if (governanceScore >= 55 && guardingScore <= 45) detectedPatterns.push("PATTERN 1 — Compliance Theatre");
    if (electronicScore >= 60 && cultureScore <= 50) detectedPatterns.push("PATTERN 2 — Technology Trap");
    if (visitorScore <= 50) detectedPatterns.push("PATTERN 3 — Invisible Contractor");
    if (governanceScore >= 55 && incidentScore <= 50 && bcpScore <= 55) detectedPatterns.push("PATTERN 4 — Paper Programme");
    const grd01 = allRatings['GRD01'] || 3;
    const grd03 = allRatings['GRD03'] || 3;
    const grd04 = allRatings['GRD04'] || 3;
    if (grd01 <= 2 && grd03 <= 2 && grd04 <= 2) detectedPatterns.push("PATTERN 6 — Principal Employer Exposure");
    const cul06 = allRatings['CUL06'] || 3;
    const cul04 = allRatings['CUL04'] || 3;
    if (cul06 <= 2 && cul04 <= 2) detectedPatterns.push("PATTERN 7 — Leadership Permission");
    const elc03 = allRatings['ELC03'] || 3;
    const elc05 = allRatings['ELC05'] || 3;
    if (electronicScore >= 60 && elc03 <= 2 && elc05 <= 2) detectedPatterns.push("PATTERN 8 — False Assurance");

    // ── Build the full domain intelligence block for the prompt ───────────────
    const domainIntelBlock = domainIntelligence.map(d => {
      const lines = [
        `\n━━ ${d.domain_name.toUpperCase()} — ${d.score}/100 (Maturity Level ${d.maturity}/5) ━━`,
        `Distribution: ${d.questions_at_1} critical (rated 1) · ${d.questions_at_2} gaps (rated 2) · ${d.questions_at_3} defined (rated 3) · ${d.questions_at_4} managed (rated 4)`,
      ];
      if (d.critical_failures.length > 0) {
        lines.push(`\nCRITICAL FAILURES (rated 1 — Ad-hoc):`);
        d.critical_failures.forEach(f => lines.push(`  • ${f}`));
      }
      if (d.gaps.length > 0) {
        lines.push(`\nGAPS (rated 2 — Developing):`);
        d.gaps.forEach(f => lines.push(`  • ${f}`));
      }
      if (d.strengths.length > 0) {
        lines.push(`\nSTRENGTHS (rated 4 — Managed):`);
        d.strengths.forEach(f => lines.push(`  • ${f}`));
      }
      if (d.assessor_comments) {
        lines.push(`\nASSESSOR COMMENTS (quote these verbatim in the report):`);
        lines.push(d.assessor_comments);
      }
      if (d.responder_comments) {
        lines.push(`\nRESPONDER COMMENTS:`);
        lines.push(d.responder_comments);
      }
      if (d.evidence_notes) {
        lines.push(`\nEVIDENCE NOTES:`);
        lines.push(d.evidence_notes);
      }
      return lines.join('\n');
    }).join('\n');

    const weakestDomains = [...domainScores].slice(0, 3);
    const strongestDomains = [...domainScores].reverse().slice(0, 3);
    const overallScore = assessment.overall_score_0_100?.toFixed(0) || '0';

    // ── THE MASTER PROMPT ─────────────────────────────────────────────────────
    const prompt = `You are a Principal Security Consultant with 22 years of hands-on experience
conducting physical security assessments across Indian corporate offices — IT/ITES, GCC, BFSI,
BPO, Manufacturing, Healthcare, and Hospitality. You have personally walked more than 300 sites
across Bengaluru, Hyderabad, Mumbai, Pune, Delhi NCR, and Chennai.

You do not write generic audit reports. You write intelligence — findings that a CISO, CFO, or
Country Security Head will read twice, quote in their next leadership review, and remember six
months from now.

Your reports are distinctive because:
1. You name PATTERNS, not just gaps. You tell the client what their answers reveal about how
   their organisation thinks about security — not just which controls are absent.
2. You quote the assessor's own words back to them. When an assessor has written a comment,
   you use it verbatim in the finding. It makes the report feel like it was written about
   their specific site — because it was.
3. You write for two audiences simultaneously: the security manager who will implement the
   findings, and the CFO who will read only the executive summary and the investment ask.
4. You are direct. If something is a serious liability, you say it is a serious liability.
   You do not soften findings with hedging language.
5. Every recommendation is specific enough that the security manager knows exactly what to
   do on Monday morning — not "improve access control" but "pull the last 3 months of PF
   ECR challans from the EPFO portal using the vendor's establishment code and cross-verify
   the headcount."

${CONSULTANT_PATTERN_LIBRARY}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSESSMENT DATA FOR THIS SPECIFIC SITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SITE: ${assessment.sites?.name || 'N/A'}
CITY: ${assessment.sites?.city || 'N/A'}${assessment.sites?.state ? ', ' + assessment.sites.state : ''}
TYPE: ${assessment.sites?.site_type || 'N/A'}
CRITICALITY: ${assessment.sites?.criticality || 'Not specified'}
HEADCOUNT: ${assessment.sites?.headcount_band || 'Not specified'}
OVERALL SCORE: ${overallScore} / 100
RISK POSTURE: ${assessment.risk_posture || 'N/A'}
SECURITY MATURITY: Level ${assessment.overall_maturity_1_5 || 'N/A'} / 5
ASSESSED BY: ${assessment.created_by_name || 'N/A'}, ${assessment.created_by_role || 'N/A'}

DOMAIN SCORES (lowest → highest):
${domainScores.map(d => `  ${d.domain_name}: ${d.score_0_100.toFixed(0)}/100 (Maturity ${d.maturity_1_5}/5)`).join('\n')}

WEAKEST: ${weakestDomains.map(d => d.domain_name).join(' · ')}
STRONGEST: ${strongestDomains.map(d => d.domain_name).join(' · ')}

DETECTED PATTERNS (based on score combinations):
${detectedPatterns.length > 0 ? detectedPatterns.join('\n') : 'No strong cross-domain patterns detected — review individual domain data.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL QUESTION-LEVEL INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${domainIntelBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Produce a consulting-grade intelligence report for this specific site.
Use the question-level data above — not just the scores.
Name the patterns you detected. Quote assessor comments verbatim where they
illuminate a finding. Write for the CISO and CFO reading it simultaneously.

WRITING RULES — NEVER VIOLATE THESE:
• Never use: "it is important to", "it is essential that", "in conclusion",
  "this highlights", "it should be noted", "going forward"
• Never start a recommendation with a gerund: not "Implementing...", "Establishing...",
  "Ensuring..." — instead: "Conduct...", "Assign...", "Pull...", "Schedule...", "Commission..."
• Every finding must name what it means about the organisation — not just what is absent
• Every recommendation must be specific: named owner type, concrete action, measurable outcome
• Regulatory references must be specific: not "labour laws" but "Code on Social Security 2020,
  Section 41, joint principal employer liability"
• City-specific context where relevant: Bengaluru IT corridor, BKC Mumbai, Hyderabad Hitech City,
  Gurugram tech parks — each has specific local threat patterns you know from experience

PRODUCE THESE SECTIONS:

SECTION 1 — SIGNATURE FINDING (1 sentence, maximum 25 words)
The single most important thing this diagnostic reveals about this organisation's
security posture. This is what gets quoted in the boardroom. It should be specific
to this site's actual pattern — not generic.
Examples of good signature findings:
  "This site has built a compliance architecture it has never verified against reality."
  "Technology investment is strong; the people and processes to operationalise it are absent."
  "Three statutory liabilities are running simultaneously — none of them are on the security team's radar."
Bad: "This site has several security gaps that need to be addressed."

SECTION 2 — EXECUTIVE SUMMARY (3 paragraphs, 200–240 words total)
Paragraph 1: Overall posture, score, maturity level, and the 2 most material risk domains.
Be direct. If this site has serious statutory liability, say so.
Paragraph 2: The cross-domain pattern you detected (use the pattern name and explain
what it reveals about how this organisation governs security). Quote one assessor
comment if available and relevant.
Paragraph 3: The single highest-priority action for leadership in the next 30 days,
with the specific consequence of inaction framed in Indian legal or operational terms.

SECTION 3 — WEAK DOMAIN ANALYSIS (for the 3 lowest-scoring domains)
For each domain, produce exactly 3 findings:
Finding 1 — CURRENT STATE: What the specific question ratings reveal — not what
a generic low score means, but what these particular questions rated 1 and 2 reveal
about this organisation's specific state. Quote assessor comments verbatim if present.
Finding 2 — OPERATIONAL CONSEQUENCE: What this gap enables, what audit it fails,
what liability it creates. Be specific about the Indian regulatory or operational
consequence. Reference the exact statute or framework.
Finding 3 — PRIORITY ACTION: One action. Named owner type (e.g. "the Head of Facilities"),
concrete first step (e.g. "obtain the vendor's EPFO establishment code and pull the
last 3 months of ECR challans"), measurable outcome, and timeframe.

SECTION 4 — STRONG DOMAIN RECOGNITION (for the 3 highest-scoring domains)
For each domain, produce 2 findings:
Finding 1 — WHAT THIS TELLS US: What the strong performance reveals about the
organisation's security intent and capability — and whether that quality is consistent
or isolated.
Finding 2 — NEXT LEVEL: The specific next investment or action that would take this
domain from its current state to the next maturity level. Be specific about what
"Level ${(assessment.overall_maturity_1_5 || 2) + 1}" looks like in this domain.

SECTION 5 — 30 / 60 / 90 DAY REMEDIATION ROADMAP
Calibrated to this site's score, type, and city. Mid-market Indian budget.
Each action: what to do · who owns it · measurable outcome · indicative cost in INR where helpful.

30 Days — 5 actions: Close the highest statutory and operational risk gaps.
Zero or low capital spend. Process and documentation focus.

60 Days — 5 actions: Structural improvements to governance, vendor management,
and monitoring that form the baseline for a sustained programme.

90 Days — 4 actions: Technology, culture, and assurance investments that move
the programme toward Maturity Level ${Math.min(5, (assessment.overall_maturity_1_5 || 2) + 1)}.

Respond ONLY with valid JSON — no preamble, no markdown fences, no explanation:
{
  "signature_finding": "string — 1 sentence, max 25 words, specific to this site",
  "executive_summary": "string — 3 paragraphs separated by \\n\\n, 200-240 words",
  "weak_domains": [
    {
      "domain": "exact domain name from data",
      "score": number,
      "findings": [
        "Current state — specific to this site's question ratings and comments",
        "Operational consequence — specific Indian regulatory or operational impact",
        "Priority action — named owner, concrete step, measurable outcome, timeframe"
      ]
    }
  ],
  "strong_domains": [
    {
      "domain": "exact domain name from data",
      "score": number,
      "findings": [
        "What strong performance reveals about this organisation",
        "Specific next investment or action for the next maturity level"
      ]
    }
  ],
  "detected_patterns": ["pattern name if applicable"],
  "remediation_30": [
    "Action · Owner · Outcome · (Cost if applicable)"
  ],
  "remediation_60": [
    "Action · Owner · Outcome · (Cost if applicable)"
  ],
  "remediation_90": [
    "Action · Owner · Outcome · (Cost if applicable)"
  ]
}`;

    // ── Call the AI (with model fallback + clear logging) ────────────────────
    const MODELS = [
      'google/gemini-3-flash-preview', // primary (current Lovable default)
      'google/gemini-2.5-flash',       // fallback 1
      'google/gemini-2.5-flash-lite',  // fallback 2
    ];

    let insights: any = null;
    let creditsExhausted = false;
    const attemptErrors: string[] = [];

    for (const model of MODELS) {
      try {
        console.log(`[generate-insights] assessment=${assessment_id} trying model=${model}`);
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          const bodyText = (await response.text()).slice(0, 500);
          const msg = `[generate-insights] assessment=${assessment_id} model=${model} HTTP ${response.status} body=${bodyText}`;
          console.error(msg);
          attemptErrors.push(`${model}: ${response.status}`);

          if (response.status === 402) {
            creditsExhausted = true;
            break; // no point trying other models on the same gateway/workspace
          }
          // 400/429/5xx → try next model
          continue;
        }

        const data = await response.json();
        const raw = data?.choices?.[0]?.message?.content ?? '';
        const clean = String(raw).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
          insights = JSON.parse(clean);
        } catch (parseErr) {
          console.error(
            `[generate-insights] assessment=${assessment_id} model=${model} JSON parse failed. raw[0..500]=${clean.slice(0, 500)}`,
            parseErr,
          );
          attemptErrors.push(`${model}: parse-error`);
          continue;
        }

        console.log(`[generate-insights] assessment=${assessment_id} model=${model} succeeded`);
        break;
      } catch (netErr) {
        console.error(
          `[generate-insights] assessment=${assessment_id} model=${model} network/exception:`,
          netErr,
        );
        attemptErrors.push(`${model}: exception`);
        continue;
      }
    }

    if (!insights) {
      if (creditsExhausted) {
        console.error(`[generate-insights] assessment=${assessment_id} credits exhausted (402)`);
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits and retry.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      console.error(
        `[generate-insights] assessment=${assessment_id} all models exhausted. attempts=${attemptErrors.join(' | ')}`,
      );
      return new Response(
        JSON.stringify({ error: 'AI generation temporarily unavailable. Please retry.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Persist to the assessments table ─────────────────────────────────────
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        executive_summary: insights.executive_summary,
        // Store full intelligence payload in remediation_plan as JSON
        remediation_plan: JSON.stringify({
          signature_finding: insights.signature_finding,
          detected_patterns: insights.detected_patterns || [],
          weak_domains: insights.weak_domains,
          strong_domains: insights.strong_domains,
          roadmap: {
            days_30: insights.remediation_30,
            days_60: insights.remediation_60,
            days_90: insights.remediation_90,
          },
        }),
      })
      .eq('id', assessment_id);

    if (updateError) {
      console.error('[generate-insights] DB update error:', updateError);
      throw updateError;
    }

    console.log(`[generate-insights] Success for assessment ${assessment_id}`);

    return new Response(
      JSON.stringify({ success: true, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-insights] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
