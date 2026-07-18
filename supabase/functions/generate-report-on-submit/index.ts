import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'npm:pdf-lib@1.17.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

const NAVY = rgb(0.05, 0.087, 0.165)
const AZURE = rgb(0.094, 0.466, 0.949)
const SLATE = rgb(0.2, 0.235, 0.31)
const SOFT = rgb(0.92, 0.94, 0.97)
const WHITE = rgb(1, 1, 1)

function band(score: number): string {
  if (score <= 40) return 'Ad Hoc (Red)'
  if (score <= 70) return 'Developing (Amber)'
  if (score <= 85) return 'Managed (Teal)'
  return 'Resilient (Green)'
}

// Word-wrap utility for pdf-lib (no native wrapping).
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const test = current ? `${current} ${w}` : w
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = w
    }
  }
  if (current) lines.push(current)
  return lines
}

// Roadmap shape mirrors PdfReport.tsx parser: parsed.roadmap.days_30/60/90 (string[]).
function parseRoadmap(planJson: string | null): { d30: string[]; d60: string[]; d90: string[] } {
  const empty = { d30: [], d60: [], d90: [] }
  if (!planJson) return empty
  try {
    const parsed = JSON.parse(planJson)
    const root = parsed.roadmap ?? parsed
    return {
      d30: Array.isArray(root.days_30) ? root.days_30.map(String) : [],
      d60: Array.isArray(root.days_60) ? root.days_60.map(String) : [],
      d90: Array.isArray(root.days_90) ? root.days_90.map(String) : [],
    }
  } catch {
    // Fallback: markdown-style sections. Pull lines after headings.
    const out = { ...empty }
    const lines = planJson.split(/\r?\n/)
    let bucket: 'd30' | 'd60' | 'd90' | null = null
    for (const raw of lines) {
      const line = raw.trim()
      if (/30[\s-]?day/i.test(line)) { bucket = 'd30'; continue }
      if (/60[\s-]?day/i.test(line)) { bucket = 'd60'; continue }
      if (/90[\s-]?day/i.test(line)) { bucket = 'd90'; continue }
      const cleaned = line.replace(/^[-•*\d.)\s]+/, '').trim()
      if (bucket && cleaned) (out as any)[bucket].push(cleaned)
    }
    return out
  }
}

function drawHeader(page: PDFPage, font: PDFFont, bold: PDFFont, title: string) {
  page.drawText(title, { x: 40, y: 790, size: 18, font: bold, color: NAVY })
  page.drawLine({ start: { x: 40, y: 780 }, end: { x: 555, y: 780 }, thickness: 1, color: AZURE })
  page.drawText('Security Intelligence Platform™ · Confidential', {
    x: 40, y: 815, size: 8, font, color: SLATE,
  })
}

function drawFooter(page: PDFPage, font: PDFFont, pageNum: number, totalPages: number) {
  page.drawText(`Page ${pageNum} of ${totalPages}`, {
    x: 40, y: 30, size: 8, font, color: SLATE,
  })
  page.drawText('Confidential · For named recipient only', {
    x: 555 - font.widthOfTextAtSize('Confidential · For named recipient only', 8), y: 30, size: 8, font, color: SLATE,
  })
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

  let body: { assessment_id?: string; regenerate?: boolean }
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

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

  const { data: assessment, error: aErr } = await admin
    .from('assessments')
    .select('id, user_id, overall_score_0_100, status, report_status, report_pdf_path, report_version, report_history, remediation_plan, executive_summary, sites(name, city, organisations(name))')
    .eq('id', assessmentId)
    .maybeSingle()
  if (aErr || !assessment) {
    return new Response(JSON.stringify({ error: 'Assessment not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: isAdminRow } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
  const isAdmin = !!isAdminRow
  if ((assessment as any).user_id !== user.id && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const isRegenerate = !!body.regenerate || (assessment as any).report_status !== 'generating'
  const prevVersion = Number((assessment as any).report_version ?? 1)
  const prevHistory = Array.isArray((assessment as any).report_history) ? (assessment as any).report_history : []
  const nextVersion = isRegenerate && (assessment as any).report_pdf_path ? prevVersion + 1 : prevVersion

  // Flip the user-facing readiness flag IMMEDIATELY so the submitted page can
  // redirect to the in-app report even if PDF rendering takes a while or fails.
  // The in-app report renders from `executive_summary` / `remediation_plan`
  // (written by generate-insights), so it doesn't depend on the PDF artefact.
  await admin
    .from('assessments')
    .update({
      report_status: 'generating',
      report_error: null,
      review_status: 'report_ready',
      report_ready_at: new Date().toISOString(),
      reviewed_by_name: 'Auto-released (initial AI report)',
      reviewed_by_role: 'SIP Intelligence Engine',
    })
    .eq('id', assessmentId)

  try {
    // Generate insights if missing — the roadmap and executive summary live there.
    let remediationPlan = (assessment as any).remediation_plan as string | null
    let executiveSummary = (assessment as any).executive_summary as string | null

    if (!remediationPlan || !executiveSummary) {
      try {
        // generate-insights validates a user JWT (not service-role). Forward the
        // caller's Authorization header so ownership/admin checks succeed.
        const insightsRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-insights`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
            'apikey': ANON,
          },
          body: JSON.stringify({ assessment_id: assessmentId }),
        })
        if (insightsRes.ok) {
          // generate-insights persists to the assessments row itself.
          const { data: refreshed } = await admin
            .from('assessments')
            .select('remediation_plan, executive_summary')
            .eq('id', assessmentId)
            .maybeSingle()
          remediationPlan = (refreshed as any)?.remediation_plan ?? remediationPlan
          executiveSummary = (refreshed as any)?.executive_summary ?? executiveSummary
        } else {
          console.error('generate-insights returned', insightsRes.status, await insightsRes.text())
        }
      } catch (e) {
        console.error('generate-insights invoke failed', e)
      }
    }

    const { data: domains } = await admin
      .from('domain_scores').select('*').eq('assessment_id', assessmentId)

    const roadmap = parseRoadmap(remediationPlan)

    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

    const siteName = (assessment as any).sites?.name ?? 'Site'
    const orgName = (assessment as any).sites?.organisations?.name ?? ''
    const score = (assessment as any).overall_score_0_100 ?? 0
    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    // ───── Page 1: Cover ─────
    const cover = pdf.addPage([595, 842])
    cover.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: NAVY })
    cover.drawText('Security Intelligence Platform™', { x: 40, y: 800, size: 16, font: bold, color: WHITE })
    cover.drawText('SIP™ · Structured · Intelligent · Practicable', { x: 40, y: 780, size: 9, font, color: rgb(0.8, 0.85, 0.95) })
    cover.drawText('Security Intelligence Report', { x: 40, y: 680, size: 22, font: bold, color: NAVY })
    cover.drawText('Security Selfie™ — Diagnostic', { x: 40, y: 655, size: 12, font, color: SLATE })
    cover.drawText(siteName, { x: 40, y: 615, size: 16, font: bold, color: SLATE })
    if (orgName) cover.drawText(orgName, { x: 40, y: 595, size: 12, font, color: SLATE })

    cover.drawText('Overall maturity score', { x: 40, y: 530, size: 10, font: bold, color: SLATE })
    cover.drawText(`${Math.round(score)} / 100`, { x: 40, y: 500, size: 36, font: bold, color: AZURE })
    cover.drawText(band(score), { x: 40, y: 475, size: 12, font, color: SLATE })

    if (nextVersion > 1) {
      cover.drawText(`Revision v${nextVersion}`, { x: 40, y: 450, size: 10, font: bold, color: AZURE })
    }
    cover.drawText(`Generated: ${generatedOn}`, { x: 40, y: 60, size: 9, font, color: SLATE })
    cover.drawText('Confidential · For named recipient only', { x: 40, y: 45, size: 9, font, color: SLATE })

    // ───── Page 2: Executive Summary ─────
    const ep = pdf.addPage([595, 842])
    drawHeader(ep, font, bold, 'Executive Summary')
    {
      const lines = wrapText(
        executiveSummary ||
        'This Security Intelligence Report™ provides a structured diagnostic of the site\'s current physical-security posture across ten domains. The executive summary will appear here once the intelligence engine has completed processing your responses.',
        font, 11, 515,
      )
      let y = 750
      for (const ln of lines) {
        if (y < 200) break
        ep.drawText(ln, { x: 40, y, size: 11, font, color: SLATE })
        y -= 16
      }

      // Methodology disclosure — must always appear so readers understand
      // exactly what this report is, and is not.
      y = Math.max(y - 18, 150)
      ep.drawText('Basis & method', { x: 40, y, size: 10, font: bold, color: NAVY })
      y -= 14
      const methodLines = wrapText(
        'This report is derived from your self-reported Security Selfie™ responses, the SIP™ knowledge graph and structured analytical models. It is not an audit. It does not involve interviews, site walkthroughs, evidence collection or physical inspection. Observations are classified as Reported (from your responses), Inferred (combined with sector benchmarks) or Recommended (advisory action).',
        font, 9, 515,
      )
      for (const ln of methodLines) {
        if (y < 60) break
        ep.drawText(ln, { x: 40, y, size: 9, font, color: SLATE })
        y -= 12
      }
    }

    // ───── Page 3: Domain Maturity ─────
    const dp = pdf.addPage([595, 842])
    drawHeader(dp, font, bold, 'Domain Maturity')
    {
      let y = 755
      const domainList = (domains ?? []) as Array<any>
      if (domainList.length === 0) {
        dp.drawText('Domain breakdown not yet calculated.', { x: 40, y, size: 11, font, color: SLATE })
      } else {
        for (const d of domainList) {
          if (y < 80) break
          const name = String(d.domain_key ?? d.domain ?? 'Domain').replace(/_/g, ' ')
          const s = Number(d.score_0_100 ?? 0)
          dp.drawText(name, { x: 40, y, size: 11, font: bold, color: NAVY })
          const barW = 280
          dp.drawRectangle({ x: 250, y: y - 2, width: barW, height: 10, color: SOFT })
          dp.drawRectangle({ x: 250, y: y - 2, width: barW * Math.min(1, s / 100), height: 10, color: AZURE })
          dp.drawText(`${Math.round(s)}`, { x: 540, y, size: 10, font: bold, color: NAVY })
          y -= 22
        }
      }
    }

    // ───── Page 4: Key Findings / Context ─────
    const cp = pdf.addPage([595, 842])
    drawHeader(cp, font, bold, 'Key Findings')
    {
      const intro = [
        'This Security Selfie™ is a diagnostic snapshot — a starting point, not a compliance verdict.',
        'The domain scores above indicate where rehearsal, governance and operational rhythm investments',
        'are most likely to lift posture in the coming quarter.',
        '',
        'The following section sets out a sequenced 30 / 60 / 90-day roadmap. It is designed to be',
        'practicable within typical Indian enterprise constraints — budget cycles, vendor onboarding',
        'lead times, and shift rosters — and respects the existing controls already in place.',
      ]
      let y = 750
      for (const ln of intro) {
        cp.drawText(ln, { x: 40, y, size: 11, font, color: SLATE })
        y -= 18
      }
    }

    // ───── Page 5+: 30 / 60 / 90-Day Roadmap (LAST substantive section) ─────
    const drawRoadmapBlock = (
      page: PDFPage,
      label: string,
      items: string[],
      startY: number,
    ): number => {
      page.drawRectangle({ x: 40, y: startY - 22, width: 515, height: 22, color: NAVY })
      page.drawText(label, { x: 50, y: startY - 16, size: 11, font: bold, color: WHITE })
      let y = startY - 38
      if (items.length === 0) {
        page.drawText('No actions identified for this horizon.', { x: 50, y, size: 10, font, color: SLATE })
        return y - 18
      }
      for (const item of items) {
        const wrapped = wrapText(`• ${item}`, font, 10, 495)
        for (const line of wrapped) {
          if (y < 80) return y
          page.drawText(line, { x: 50, y, size: 10, font, color: SLATE })
          y -= 14
        }
        y -= 4
      }
      return y - 6
    }

    let rp = pdf.addPage([595, 842])
    drawHeader(rp, font, bold, '30 / 60 / 90-Day Remediation Roadmap')
    let yCursor = 755

    for (const [label, items] of [
      ['Next 30 Days', roadmap.d30] as const,
      ['Next 60 Days', roadmap.d60] as const,
      ['Next 90 Days', roadmap.d90] as const,
    ]) {
      if (yCursor < 180) {
        rp = pdf.addPage([595, 842])
        drawHeader(rp, font, bold, '30 / 60 / 90-Day Remediation Roadmap (cont.)')
        yCursor = 755
      }
      yCursor = drawRoadmapBlock(rp, label, items, yCursor)
      yCursor -= 12
    }

    // ───── Closing / Confidentiality ─────
    const closing = pdf.addPage([595, 842])
    drawHeader(closing, font, bold, 'Confidentiality & Next Steps')
    {
      const lines = [
        'This report is confidential and intended only for the named recipient.',
        'It must not be circulated outside the organisation without written consent.',
        '',
        'For a deeper advisory engagement — scoped to your priorities — please reach',
        'out via Security Studio™ from the SIP™ Command Centre. A senior advisor',
        'will get in touch within two working days.',
        '',
        'Security Intelligence Platform™ · Made in India · Built for the world.',
      ]
      let y = 750
      for (const ln of lines) {
        closing.drawText(ln, { x: 40, y, size: 11, font, color: SLATE })
        y -= 18
      }
    }

    // Footer + page numbers on every page.
    const total = pdf.getPageCount()
    pdf.getPages().forEach((p, i) => drawFooter(p, font, i + 1, total))

    const bytes = await pdf.save()
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const path = `${assessmentId}/security-selfie-v${nextVersion}-${yyyymmdd}.pdf`

    const { error: upErr } = await admin.storage.from('reports').upload(path, bytes, {
      contentType: 'application/pdf', upsert: true,
    })
    if (upErr) throw upErr

    const newHistory = (assessment as any).report_pdf_path && isRegenerate
      ? [
          ...prevHistory,
          {
            version: prevVersion,
            pdf_path: (assessment as any).report_pdf_path,
            archived_at: new Date().toISOString(),
            status_at_archive: (assessment as any).report_status,
          },
        ]
      : prevHistory

    await admin
      .from('assessments')
      .update({
        report_status: 'pending_review',
        report_pdf_path: path,
        report_generated_at: new Date().toISOString(),
        report_version: nextVersion,
        report_history: newHistory,
        report_email_attempts: 0,
        report_error: null,
        // Auto-release the initial AI report to the user. Admin can still issue a
        // revised version later via the Reports queue; that flow re-runs through
        // this same function and bumps report_version. Approve & Send still
        // controls the emailed PDF delivery.
        review_status: 'report_ready',
        report_ready_at: new Date().toISOString(),
        reviewed_by_name: 'Auto-released (initial AI report)',
        reviewed_by_role: 'SIP Intelligence Engine',
        status: 'completed',
      })
      .eq('id', assessmentId)

    await admin.from('report_audit_log').insert({
      assessment_id: assessmentId,
      actor_user_id: user.id,
      actor_label: isAdmin ? 'admin' : 'system',
      action: isRegenerate && nextVersion > 1 ? 'regenerated' : 'generated',
      report_version: nextVersion,
      metadata: { pdf_path: path, previous_version: prevVersion },
    })

    return new Response(JSON.stringify({ success: true, path, version: nextVersion }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = (e as Error).message ?? String(e)
    console.error('generate-report-on-submit failed', msg)
    await admin
      .from('assessments')
      .update({ report_status: 'failed', report_error: msg.slice(0, 500) })
      .eq('id', assessmentId)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
