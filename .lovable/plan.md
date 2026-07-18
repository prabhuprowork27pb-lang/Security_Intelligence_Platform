## Plan: make the 120-second clock impossible to miss

1. **Confirm the user always lands on the countdown page**
   - Keep the post-submit route as `/assessments/:id/submitted`.
   - Ensure unlock/payment return paths also route to `/assessments/:id/submitted`, not directly to `/assessments/:id`.

2. **Remove the current failure mode where the countdown waits behind data loading**
   - Change `AssessmentSubmitted.tsx` so the 120-second timer screen renders immediately, even while the assessment row is still loading.
   - If site details are not loaded yet, show a safe fallback like “your site” without hiding the clock.
   - Only show the “Submission not available” error after an actual failed load/retry state, not before the timer appears.

3. **Make the clock visually explicit**
   - Keep the large `MM:SS` countdown ring.
   - Add a prominent plain-text timer line near the heading: `Report opens in 02:00`, ticking every second.
   - Keep the ring visible regardless of reduced-motion settings; reduced motion should only affect animation flair, not visibility.

4. **Guarantee reveal at 00:00**
   - Keep navigation triggered only by `elapsed >= 120`.
   - At 00:00, automatically navigate to `/assessments/:id` in the same window, whether or not background report generation has already completed.

5. **Verification**
   - Use the live preview route `/assessments/:id/submitted` where possible to confirm the clock is rendered before backend data finishes loading.
   - Confirm the DOM contains the timer text and the SVG ring.
   - Confirm navigation logic still targets `/assessments/:id` at the end of the countdown.