# SIP Production Regression Checklist

Run this checklist before every production rollout. Each item lists a precondition, the action to perform, and the expected result. Tick the box only after observing the expected result in the preview or staging environment.

Tester: ______________________  Date: ______________________  Build / Commit: ______________________

---

## 1. Assessment Wizard — autosave & progress

| # | Precondition | Action | Expected | Pass |
|---|---|---|---|---|
| 1.1 | Logged in, fresh draft assessment | Answer 3 questions in Domain 1, then switch to Domain 2 | Header counter immediately shows `0 of N answered` for Domain 2 (no stale value from Domain 1) | ☐ |
| 1.2 | Wizard open, network throttled to offline | Answer 1 question, wait for 1 silent auto-save failure | No toast appears (threshold is 3) | ☐ |
| 1.3 | Same as 1.2 | Continue until 3 consecutive auto-save failures | Visible toast: "Changes not saved — check your connection" | ☐ |
| 1.4 | Network restored | Answer another question | Counter resets, auto-save succeeds, no further toast | ☐ |
| 1.5 | Logged-out user lands on wizard URL directly | Page load | Redirected to `/auth?next=...` (no insert attempted) | ☐ |

## 2. Submit guard

| # | Precondition | Action | Expected | Pass |
|---|---|---|---|---|
| 2.1 | All domains complete, network healthy | Click Submit | Navigates to payment / unlock flow | ☐ |
| 2.2 | All domains complete, force `saveDraft()` to fail (block POST in DevTools) | Click Submit | Error toast shown, user remains on wizard, no payment redirect | ☐ |
| 2.3 | Submit attempted with `user.id` cleared (token expired) | Click Submit | Throws "Not authenticated", redirected to auth | ☐ |

## 3. Assessment Results — load error state

| # | Precondition | Action | Expected | Pass |
|---|---|---|---|---|
| 3.1 | Valid completed assessment | Open `/results/:id` | Renders scores, domains, pinned answers via `Promise.all` (single render, no flicker) | ☐ |
| 3.2 | Block one of the Supabase reads via DevTools | Reload `/results/:id` | Error UI: `text-destructive` icon, heading "Could Not Load Report", buttons "Try Again" + "Back to Dashboard" | ☐ |
| 3.3 | Restore network, click "Try Again" | — | Page recovers and renders normally | ☐ |
| 3.4 | Click "Back to Dashboard" from error state | — | Routes to Command Centre | ☐ |

## 4. PDF report (`downloadPdf`)

| # | Precondition | Action | Expected | Pass |
|---|---|---|---|---|
| 4.1 | Results page rendered | Click Download PDF | File downloads; opens with all charts visible (not blank) | ☐ |
| 4.2 | Fixture with `executive_summary` > 2000 chars | Generate PDF | Long text wraps cleanly across pages, no clipping or overflow | ☐ |
| 4.3 | Fixture missing site city / domain notes | Generate PDF | Renders fallback ("—" or "Not provided"), never `undefined` / `null` | ☐ |
| 4.4 | Trigger error mid-render | — | `finally` resets generating state; button re-enabled | ☐ |
| 4.5 | Score bands in PDF | Visual compare to dashboard | Red 0-40, Amber 41-70, Teal 71-85, Green 86-100 colours match | ☐ |

## 5. Debug route removal

| # | Precondition | Action | Expected | Pass |
|---|---|---|---|---|
| 5.1 | Production build | Visit `/debug/saass-colors` | 404 / NotFound page | ☐ |
| 5.2 | Repo | `rg "SaassColorsDebug" src/` | Zero matches | ☐ |

## 6. Ask SAASS assistant

| # | Precondition | Action | Expected | Pass |
|---|---|---|---|---|
| 6.1 | Logged in, results page open | Send 12 prompts back-to-back | First 10 succeed; 11th/12th return 429; toast shown, composer stays usable, focus retained | ☐ |
| 6.2 | Send prompt containing `<script>alert(1)</script>` and 10k-char extra text | — | Backend sanitizes (regex `/[<>"'`]/g`, length caps); response streams normally; no HTML executes in chat UI | ☐ |
| 6.3 | Payload with 50 domain_scores entries | — | Backend caps to 20; chat still responds | ☐ |
| 6.4 | Force upstream model failure | — | HTTP 502 with generic error; friendly toast in UI; no stack trace leak; composer focused | ☐ |

## 7. DSLR lead capture sanitization

| # | Precondition | Action | Expected | Pass |
|---|---|---|---|---|
| 7.1 | DiagnosticStart form | Submit name `<b>Test</b>` (300 chars), email 400 chars, phone 50 chars, message 2000 chars | Row inserted with name stripped of HTML, capped: name 120 / role 120 / email 255 / phone 20 / message 500 | ☐ |
| 7.2 | Unauthenticated submission | Submit valid lead | Insert succeeds via anon policy; no other table access leaks | ☐ |

## 8. Edge function auth & RLS

| # | Function | Anonymous call (no Authorization) | Authenticated owner | Authenticated non-owner |
|---|---|---|---|---|
| 8.1 | `ask-saass` | 401 | 200 | 403 | ☐ |
| 8.2 | `calculate-scores` | 401/403 | 200 | 403 (identical to "not found") | ☐ |
| 8.3 | `generate-insights` | 401 | 200 | 403 | ☐ |
| 8.4 | `generate-pdf` | 401 | 200 | 403 | ☐ |
| 8.5 | `auth-email-hook` | Signed webhook only | n/a | n/a | ☐ |

For each RLS-protected table (`assessments`, `sites`, `organisations`, `question_responses`, `domain_scores`, `payments`, `pinned_smarty_answers`, `dslr_leads`, `user_roles`):

- ☐ Anonymous SELECT returns 0 rows / permission denied (except `dslr_leads` insert-only anon policy).
- ☐ Authenticated user only sees own rows.
- ☐ Admin (via `has_role`) sees all rows.

## 9. End-to-end smoke (fresh user)

- ☐ Magic-link signup completes; lands on Command Centre.
- ☐ Org + site creation persists; visible on reload.
- ☐ Selfie completed across all 10 domains; submit succeeds.
- ☐ Results dashboard renders with correct overall score and band.
- ☐ PDF downloads and matches dashboard.
- ☐ DSLR enquiry submitted from public page; row visible in admin queue.
- ☐ Logout → all protected routes redirect to `/auth?next=...`.

---

### Sign-off

- QA Lead: ______________________
- Engineering: ______________________
- Product: ______________________

Rollout approved: ☐ Yes  ☐ No (blockers listed below)

Blockers / notes:
