/**
 * SIP Free Launch Mode — central feature flag.
 *
 * While FREE_LAUNCH_MODE is true:
 *  - Authenticated users get full Security Selfie™ access without paying.
 *  - The Razorpay flow, payments table, and unlock route remain intact but dormant.
 *  - Each user receives FREE_ASSESSMENT_LIMIT complimentary completed assessments.
 *
 * To restore paid mode, flip FREE_LAUNCH_MODE to false. No other changes required.
 */
export const FREE_LAUNCH_MODE = true;

/**
 * Number of completed (submitted) Security Selfie™ assessments allowed per
 * authenticated user during the complimentary launch period.
 */
export const FREE_ASSESSMENT_LIMIT = 5;
