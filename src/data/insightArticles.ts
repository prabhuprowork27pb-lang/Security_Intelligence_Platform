/**
 * Intelligence Insights — content registry.
 * Free visitors see `teaser` (≈first 30%). Paid/admin users see full `body`.
 * Markdown-lite: paragraphs split on blank lines, `## ` headings, `- ` bullets.
 */
export type InsightCategory =
  | "Operational Observation"
  | "Maturity Insight"
  | "Governance Signal"
  | "Security Pulse";

export interface InsightArticle {
  slug: string;
  category: InsightCategory;
  title: string;
  dek: string;
  read: string;
  author: string;
  published: string;
  teaser?: string; // visible to all
  body?: string;   // visible only to paid / admin
  isPremiumOnly?: boolean;
}

export const INSIGHT_ARTICLES: InsightArticle[] = [
  {
    slug: "shift-handover-blindspot",
    category: "Operational Observation",
    title: "The shift-handover blind spot that costs more than any breach",
    dek:
      "Across 60+ Indian operating environments, the most consistent operational gap surfaces in the seven minutes between outgoing and incoming security shifts.",
    read: "6 min read",
    author: "SIP™ Field Intelligence",
    published: "May 2026",
    teaser: `The data is uncomfortable. Across more than sixty Indian operating environments — IT/ITES campuses, GCCs, manufacturing sites, corporate headquarters — the single most consistent operational gap is not perimeter intrusion, not access tailgating, not even response latency.

It is the seven minutes between the outgoing and incoming security shift.

## What we observed

During Security Selfie™ diagnostics conducted over the last eighteen months, ninety-one percent of sites exhibited at least one of the following during handover:

- Visitor pass logs reconciled informally rather than physically counted
- CCTV viewing handed over verbally, without a documented "events of note" register
- Key, radio and panic-button inventories assumed rather than counted
- Incident continuation notes communicated by memory, not by written brief

These are not failures of intent. They are failures of design.`,
    body: `## Why this matters more than the incidents themselves

Most security functions in India still measure their performance by **what was caught**. A more honest measure is **what was visible during handover** — because every operational truth that does not survive a shift change becomes silent debt the next shift inherits.

The seven-minute window is small enough that boards never review it, but large enough that an entire operational narrative can dissolve inside it.

## Three sites, three trajectories

### Site A — a Bengaluru GCC, 1,200 headcount
Handover was conducted at the main gate, standing. The incoming supervisor signed a register that was already pre-filled in light pencil. No CCTV review. No key count. A visitor who had overstayed by four hours was identified only when their host called reception the next morning.

### Site B — a Pune IT/ITES campus, 3,400 headcount
Handover was a fifteen-minute structured brief in a small handover room. The incoming team reviewed the last hour of CCTV at 4× speed, counted radios, counted keys, and read a written "events of note" page. The outgoing team stayed for the first ten minutes of the new shift. Cost: 25 person-minutes per change.

### Site C — a Gurugram corporate HQ, 600 headcount
Handover existed on paper. In practice, the outgoing shift left ten minutes early; the incoming shift arrived five minutes late. Fifteen minutes of unattended console.

Site B was, unsurprisingly, the only one of the three with a defensible audit trail when an incident occurred eleven weeks later.

## The design fix is cheap. The operating fix is harder.

A defensible handover requires four artefacts:

1. A pre-printed handover brief with seven fixed fields
2. A timed CCTV review window (minimum four minutes, recorded as performed)
3. A physical inventory count, signed by both shifts
4. A ten-minute overlap window, with the outgoing shift remaining present

The design fix takes a week. The operating fix — making it survive month three, month six, month twelve — takes leadership attention that most security functions cannot sustain without external rhythm.

## What we recommend

Run a single handover observation, unannounced, at 06:55 hrs. Record what you see. Compare it to what the standard operating procedure says happens. The delta is your operational truth.

This is not a maturity question. It is an attention question — and attention is the most expensive resource in any security function.

---

*This narrative is part of the {{PLATFORM}} Field Intelligence series. It draws on anonymised observations from Security Selfie™ diagnostics across Indian operating environments. No client, site or individual is identifiable.*`,
  },
  {
    slug: "maturity-without-investment",
    category: "Maturity Insight",
    title: "Why maturity rarely correlates with investment",
    dek:
      "Three sites with comparable budgets, three different posture trajectories. The variable is not spend — it is the operating rhythm leadership chooses to defend.",
    read: "8 min read",
    author: "SIP™ Maturity Practice",
    published: "May 2026",
    teaser: `The single most stubborn myth in physical security is that maturity is a function of budget. It is not. After scoring more than sixty Indian sites across the ten {{PLATFORM}} domains, the correlation between annual security spend and the SIP™ maturity score is statistically weak — and in some segments, slightly negative.

That last part deserves to be read twice.

## What actually correlates with maturity

Three variables explain the majority of the variance we see:

- **Operating rhythm** — the cadence and discipline of recurring reviews
- **Leadership proximity** — how close the senior accountable owner is to operational reality
- **Documentation as habit** — written narratives, not just dashboards`,
    body: `## A useful comparison

Consider three sites we diagnosed within an eight-week window, all in the IT/ITES segment, all with comparable headcount (2,800 – 3,400), all with annual physical security budgets within 12% of each other.

| Site | Budget index | SIP™ score | Defining feature |
|------|--------------|------------|------------------|
| Alpha | 1.00 | 78 | Weekly leadership walk, written |
| Beta | 0.96 | 71 | Quarterly dashboard, no walk |
| Gamma | 1.11 | 54 | Annual audit, ad-hoc reviews |

Gamma spent the most and scored the lowest. Alpha spent the median and scored the highest. The differentiator was not technology, not vendor selection, not even guard-to-headcount ratio. It was a single recurring leadership ritual that survived through twelve consecutive months.

## Why investment does not buy maturity

Investment buys **capability**. Maturity is the **sustained operational use of that capability**. The gap between the two is where most physical security functions quietly drift.

A site with twelve cameras and a weekly review discipline will out-mature a site with sixty cameras and quarterly review. The cameras are the cheaper variable. Attention is the expensive one.

## The leadership signal

When we ask senior accountable owners — typically a Head of Admin, a CSO, or a COO — "when did you last walk this site end-to-end?", the distribution of answers is revealing:

- Less than 7 days: ~22% of leaders. Their sites score, on average, in the upper maturity band.
- 7–30 days: ~41%. Sites score in the median band.
- More than 30 days: ~37%. Sites cluster in the lower two bands.

Leadership proximity is not a moral observation. It is an operational one. Posture decays at a measurable rate when leadership attention thins.

## The rhythm we recommend

A defensible operating rhythm has three layers:

1. **Daily** — a five-minute morning intelligence brief, written, single page
2. **Weekly** — a leadership walk, route varied, with a one-paragraph written observation
3. **Quarterly** — a maturity check against the same ten domains, scored, archived

The cost is small. The compounding is significant.

## The investment that does pay back

If the budget conversation is unavoidable, the spend that most reliably moves maturity is **structured external review**. Not a vendor audit — a calibrated diagnostic that produces a comparable score over time. This is what the {{PLATFORM}} was built to provide.

The point is not the score itself. The point is the rhythm the score forces.

---

*Drawn from anonymised diagnostics across IT/ITES, GCC and manufacturing environments, FY 2025–26.*`,
  },
  {
    slug: "governance-fatigue",
    category: "Governance Signal",
    title: "Governance fatigue: the silent driver of security drift",
    dek:
      "Quarterly reviews degrade into status updates. Status updates degrade into spreadsheets. Spreadsheets degrade into silence. A pattern, not an exception.",
    read: "5 min read",
    author: "SIP™ Governance Practice",
    published: "April 2026",
    teaser: `There is a predictable decay curve in physical security governance, and most functions are sliding down it without noticing.

It begins with a quarterly review board. Within two cycles, the review becomes a status update. Within four cycles, the status update becomes a spreadsheet circulated by email. Within six cycles, the spreadsheet stops being read.

This is governance fatigue. It is the single largest silent driver of posture drift we observe in Indian operating environments.

## How to detect it early`,
    body: `## The four signals of governance fatigue

1. **The agenda becomes recycled.** The same five items appear quarter after quarter, with minor variations. New risks are crowded out.
2. **The pre-read shrinks.** Twelve pages becomes six becomes two becomes "we'll cover it in the meeting".
3. **The attendees thin.** The COO sends a delegate. The CFO drops off entirely. The CSO finds themselves chairing a room of operational managers.
4. **The minutes lose teeth.** "Action: review and revert" replaces specific owners and specific dates.

If three of these four are present, governance is no longer the control surface it was designed to be.

## Why this matters operationally

A board-level security review is not theatre. It is the mechanism by which operational truth surfaces to the people who can authorise change. When the mechanism degrades, operational truth pools at the bottom of the organisation, where it cannot be acted upon.

The consequence is not immediate. It is a six-to-eighteen-month drift in posture that is invisible until an incident.

## The intervention

The most effective intervention we have observed is not a new framework. It is a **calibration ritual** — a single, time-boxed external observation that resets the rhythm.

A SIP™ Security Selfie™ run in week one of a new governance year accomplishes three things simultaneously:

- It produces a comparable score that re-engages senior attention
- It forces a written narrative that defeats spreadsheet-creep
- It establishes a baseline the next review cannot quietly drift away from

## A practical reset

If you suspect governance fatigue in your function, the diagnostic is uncomfortable but quick:

- Read the last four governance pre-reads back-to-back
- Count repeated items
- Count items closed versus items rolled forward
- Read the attendance log

If the picture is not what you would defend to a board, the rhythm is broken. Resetting it is cheaper than rebuilding the function after an incident.

---

*This narrative is part of the {{PLATFORM}} Governance Practice series.*`,
  },
  {
    slug: "psara-beyond-compliance",
    category: "Security Pulse",
    title: "PSARA beyond compliance: reading the operating signal",
    dek:
      "Statutory adherence is necessary, not sufficient. The operating signal embedded in PSARA records is what separates a guarded site from a defended one.",
    read: "7 min read",
    author: "SIP™ India Practice",
    published: "April 2026",
    teaser: `PSARA is one of the most under-read documents in Indian physical security. Most functions treat it as a statutory ceiling — a box to clear before audit. Read more carefully, it is a structured operating signal about your guarding posture that almost no one is extracting.

## The compliance reading vs the intelligence reading

The compliance reading asks: are licences current, are guards trained, are records filed?

The intelligence reading asks: what does the pattern of these records say about how this function is actually operating?

The second reading is where the value sits.`,
    body: `## What PSARA records actually reveal

Look at a twelve-month set of PSARA-related records — licence renewals, training certifications, guard turnover, agency rotation, incident reporting — and four patterns emerge that no dashboard captures:

### 1. Turnover signal
A guarding agency rotating more than 35% of personnel on a given site within a year is signalling something. Sometimes wage pressure. Sometimes operational friction. Sometimes leadership churn at the agency itself. None of these are visible in the monthly invoice.

### 2. Training cadence drift
PSARA mandates refresher training. The interval between refreshers — and whether the same trainer is used — is a quiet indicator of agency seriousness. Eighteen-month intervals are common. Twenty-four-month intervals are a red flag.

### 3. Licence-to-deployment lag
The gap between licence issue and deployment to the site tells you whether the agency is operating with bench depth or scrambling. Same-week deployment is operationally typical; same-day deployment is a stress signal.

### 4. Incident reporting asymmetry
The ratio of agency-reported incidents to client-observed incidents reveals reporting culture. A healthy site has near-parity. A drifting site has client observations vastly outnumbering agency reports.

## Why none of this is in the standard audit

Standard PSARA audits are compliance audits. They confirm the existence of documents. They are not designed to read the operating signal embedded across documents over time. That reading requires a structured diagnostic — which is precisely the work the {{PLATFORM}} performs on Domain 06 (Guarding & Manpower Operations) of the Security Selfie™.

## Three questions to ask this week

1. What is our twelve-month guard turnover rate, by name, by post?
2. When was the last refresher training, and was it the same trainer as the previous cycle?
3. In the last quarter, how many incidents did we observe that the agency did not file?

The answers, more than any audit report, will tell you the operating health of your guarding function.

## The Indian context premium

PSARA exists because Indian operating environments demand a layer of structured oversight that imported frameworks (ISO 18788, ISO 22301) handle differently. Treating PSARA as native rather than residual is what separates a function that is **compliant** from a function that is **operationally defended**.

---

*Part of the {{PLATFORM}} India Practice series on indigenous operational frameworks.*`,
  },
  {
    slug: "intelligence-vs-reporting",
    category: "Maturity Insight",
    title: "Intelligence versus reporting — and why most boards confuse the two",
    dek:
      "A monthly report tells you what happened. Intelligence tells you what is changing. Most security functions are still optimised for the former.",
    read: "9 min read",
    author: "SIP™ Intelligence Practice",
    published: "March 2026",
    teaser: `If your monthly security pack reads roughly the same as it did six months ago — same charts, same incident counts, same rolling commentary — your function is producing reporting, not intelligence.

The distinction matters more than the language suggests.

**Reporting** describes what happened.
**Intelligence** describes what is changing.

Boards consume the first and assume they have received the second. They almost never have.

## The four questions a true intelligence pack answers`,
    body: `## The four-question test

Open your most recent monthly security pack and check whether it directly answers these four questions in writing:

1. **What changed in our posture this month, and why?**
2. **What is degrading slowly that we cannot yet see in incidents?**
3. **What did we learn that we did not know last month?**
4. **What decision are we asking the board to make as a result?**

If three of the four are not answered, you have a reporting artefact, not an intelligence artefact.

## Why reporting outlives its usefulness

Reporting templates are sticky. They were designed by someone, approved by a board, and reproduced quarterly because no one was asked to question them. Over time, they become the function's self-image — and that self-image starts to constrain what the function notices.

A camera count is reporting. A trend in failed access attempts at a specific reader, segmented by time-of-day, is intelligence. The first reassures. The second moves a decision.

## The maturity boundary

In the SIP™ maturity model, the boundary between Level 3 (Managed) and Level 4 (Intelligent) is precisely this transition. Level 3 functions produce reliable, repeatable reporting. Level 4 functions produce narratives that change leadership behaviour.

The cost of moving from Level 3 to Level 4 is not technology. It is editorial discipline — the willingness to throw away half the existing pack and replace it with two pages of written narrative.

## What an intelligence pack looks like

A defensible monthly intelligence brief contains:

- **One paragraph of posture commentary** — what changed, in plain English
- **Three "leading signals"** — degradations not yet visible as incidents
- **One decision request** — a specific ask of the board
- **A two-line maturity note** — direction of travel against the prior month
- An appendix of the underlying reporting (for those who want it)

Note what is absent: charts as the front page, incident counts as the headline, vendor scorecards as the body. These belong in the appendix.

## The objection, and the response

The most common objection is: "the board wants the numbers."

The honest response is: the board wants confidence. Numbers are one route to confidence. A structured intelligence narrative is a faster, more durable route — and it is the route advisory boards in regulated industries have already adopted.

## Where the {{PLATFORM}} fits

The Security Selfie™ is, in essence, a structured intelligence pack delivered quarterly. The Security Studio™ extends it into a continuous advisory rhythm. Neither replaces internal reporting. Both replace the **board-facing artefact** that internal reporting has, in most functions, quietly become.

If your current monthly pack would not survive the four-question test, the cheapest reset is one structured external diagnostic. The discipline it forces tends to outlast the engagement itself.

---

*Part of the {{PLATFORM}} Intelligence Practice series on board-facing security narrative.*`,
  },
  {
    slug: "indian-context-frameworks",
    category: "Governance Signal",
    title: "Why imported frameworks under-serve Indian operating environments",
    dek:
      "ISO 18788 and ISO 22301 remain the gold standards. The work is in the local translation — labour cycles, statutory layers, climate, and crowd dynamics.",
    read: "8 min read",
    author: "SIP™ India Practice",
    published: "March 2026",
    teaser: `ISO 18788 and ISO 22301 are the right frameworks. That is not in question. They are internally coherent, internationally calibrated, and they hold up under scrutiny.

What they are not is **locally translated**.

Applied unmodified to Indian operating environments, they over-index on assumptions that quietly fail at the operating edge: stable labour cycles, single-statute compliance regimes, predictable climate, low-density crowd dynamics, mature private security ecosystems.

None of these are safe assumptions in India.

## The five translation gaps we see most often`,
    body: `## 1. Labour cycles

Indian guarding rosters operate on different cadences from the implicit assumptions in ISO 18788. Wage cycles, festival rotations, monsoon attendance, regional migration patterns — these affect operational continuity in ways the framework does not model. A defensible posture has to account for them explicitly.

## 2. Statutory layering

ISO frameworks assume a single, coherent regulatory environment. India layers PSARA, state-level licensing, building bye-laws, DGFASLI for industrial sites, IBC for critical infrastructure, and sectoral regulators on top of each other. Each layer has its own audit cycle. The framework as written cannot reconcile them — the local advisory must.

## 3. Climate as an operational variable

Monsoon weeks shift attendance, drainage, perimeter integrity, and CCTV reliability simultaneously. Summer peak in north India affects guard hydration and rotation. These are operational realities the imported framework does not acknowledge. The translation must.

## 4. Crowd density and event dynamics

Indian sites operate at headcount densities that most ISO templates were not calibrated for. A 3,500-headcount IT campus during shift change is a crowd management problem; the framework treats it as access control. The two are not the same.

## 5. Vendor maturity asymmetry

The private security ecosystem in India is bifurcated. A small set of national players operate at international standards. A long tail of regional players operate at variable standards. The framework assumes the vendor is, on average, capable. The local reality requires the function to plan for vendor variance explicitly.

## The translation, not the replacement

The right move is not to discard ISO 18788 and ISO 22301. It is to extend them with an Indian operating overlay. This is what the SIP™ ten-domain model encodes. The international frameworks remain the spine; the overlay is what makes the spine load-bearing in the local environment.

## What a translated diagnostic looks like

When the {{PLATFORM}} runs a Security Selfie™, the underlying maturity scale is ISO-aligned. The questions, evidence requests and operational ratings are India-translated. The narrative that emerges reads as both internationally credible and locally usable — which is the bar a modern security function should hold itself to.

## A note on imported playbooks

If your current security playbook is a US or EU template lightly localised with a logo change, the playbook is structurally wrong. Not in its principles — its principles are sound. In its operational assumptions. The function is then being asked to execute against a set of assumptions that quietly do not hold.

The fix is editorial: rewrite three sections — labour, statute, climate — in the local voice. The rest of the playbook becomes load-bearing again.

---

*Part of the {{PLATFORM}} India Practice series.*`,
  },
  {
    slug: "contractor-risk-underestimated",
    category: "Security Pulse",
    title: "Why contractor risk is the most underestimated gap in Indian corporate security",
    dek: "Repeat AMC vendors and housekeeping staff are the highest-frequency access category and the lowest-screened. A pattern observed across 40+ sites.",
    read: "7 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "dpdp-act-physical-security",
    category: "Governance Signal",
    title: "The DPDP Act 2023 has physical security implications most teams have not mapped",
    dek: "India's data protection law extends obligations into the physical environment. Most security teams have not yet connected the two frameworks.",
    read: "6 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "guarding-compliance-principal-employer",
    category: "Security Pulse",
    title: "Principal employer liability: the guarding compliance gap nobody wants to own",
    dek: "Under the Code on Social Security 2020, principal employers carry joint liability for contractor PF defaults. Most organisations are exposed and unaware.",
    read: "8 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "night-shift-security-gap",
    category: "Operational Observation",
    title: "The night shift is where most Indian office security programmes quietly fail",
    dek: "Reduced manning, passive monitoring, and absent site-specific protocols create a predictable vulnerability window between 10pm and 6am.",
    read: "5 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "security-culture-leadership-gap",
    category: "Maturity Insight",
    title: "Security culture starts at the top — and most Indian offices have a leadership gap",
    dek: "When senior leaders bypass badge protocols or request VIP exemptions, the cultural signal travels faster than any awareness training.",
    read: "6 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "gcc-audit-readiness",
    category: "Governance Signal",
    title: "GCC audit readiness: what a US or UK client security assessor actually checks",
    dek: "Client security audits at Indian GCCs follow a predictable pattern. Understanding the checklist before the assessor arrives changes the outcome.",
    read: "9 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "incident-register-value",
    category: "Operational Observation",
    title: "The incident register is your most valuable security asset. Most sites don't have one.",
    dek: "Near-misses are the leading indicators of serious events. Sites without a maintained register are operating without early warning.",
    read: "4 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "tailgating-indian-offices",
    category: "Security Pulse",
    title: "Tailgating in Indian offices: why policy alone never fixes it",
    dek: "Social norms override security policy at the access point when guards are not empowered and employees are not culturally aligned.",
    read: "5 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "bcp-testing-reality",
    category: "Maturity Insight",
    title: "BCP testing: the gap between the document and the drill",
    dek: "Annual announced drills produce compliance records, not operational readiness. The distinction matters when you need the plan to actually work.",
    read: "6 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "electronic-security-cybersecurity",
    category: "Governance Signal",
    title: "Your CCTV system is a cybersecurity liability and most security teams don't know it",
    dek: "IP-based cameras on unsegregated networks with default credentials are a known attack vector. The security team rarely owns the fix.",
    read: "7 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "perimeter-myths",
    category: "Operational Observation",
    title: "The perimeter myths that persist in Indian corporate offices",
    dek: "Three assumptions about compound walls, lighting, and secondary gates that security leaders keep making — and what actually happens as a result.",
    read: "5 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
  {
    slug: "psara-beyond-licence",
    category: "Security Pulse",
    title: "PSARA is not just a licence — it is a minimum standard most vendors are not meeting",
    dek: "Having a PSARA licence on file is not the same as PSARA compliance. The distinction becomes important when an inspector visits.",
    read: "5 min read",
    author: "SIP™ Field Intelligence",
    published: "June 2026",
    isPremiumOnly: true,
  },
];

export function getInsightArticle(slug: string): InsightArticle | undefined {
  return INSIGHT_ARTICLES.find((a) => a.slug === slug);
}
