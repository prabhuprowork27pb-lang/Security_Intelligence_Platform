import { parsePhoneNumberFromString, isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { z } from "zod";

/**
 * Strict mobile-number validation for SIP onboarding.
 *
 * - Defaults to India (+91) when no country code is present.
 * - Accepts international E.164 numbers when prefixed with "+".
 * - Rejects obvious test patterns (all-same-digit, sequential).
 * - Returns the canonical E.164 form on success.
 */

const DEFAULT_COUNTRY: CountryCode = "IN";

// Obvious test/junk patterns we reject even if libphonenumber accepts them.
const JUNK_PATTERNS = [
  /^(\+?\d)\1{9,}$/,           // +91 9999999999, 0000000000…
  /^\+?1234567890$/,
  /^\+?0123456789$/,
];

export interface MobileValidationResult {
  ok: boolean;
  e164?: string;
  reason?: string;
}

export function validateMobile(raw: string, country: CountryCode = DEFAULT_COUNTRY): MobileValidationResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: false, reason: "Mobile number is required" };

  // Junk-pattern guard first — applied to the digits only, not the formatting.
  const digitsOnly = trimmed.replace(/[^\d+]/g, "");
  if (JUNK_PATTERNS.some((rx) => rx.test(digitsOnly))) {
    return { ok: false, reason: "Please enter a real mobile number" };
  }

  const parsed = parsePhoneNumberFromString(trimmed, country);
  if (!parsed || !parsed.isValid()) {
    return { ok: false, reason: "Enter a valid mobile number (e.g. +91 98xxxxxxxx)" };
  }

  // Reject landline-style numbers; we want mobiles only.
  const type = parsed.getType();
  if (type && type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") {
    return { ok: false, reason: "Please enter a mobile number, not a landline" };
  }

  // India-specific guard: mobile numbers always start with 6/7/8/9.
  if (parsed.country === "IN") {
    const national = parsed.nationalNumber.toString();
    if (national.length !== 10 || !/^[6-9]/.test(national)) {
      return { ok: false, reason: "Indian mobile numbers must be 10 digits starting with 6, 7, 8 or 9" };
    }
  }

  // Also re-apply the junk check to the canonical form to catch numbers like
  // +91 99999 99999 that survived initial digit normalisation.
  if (JUNK_PATTERNS.some((rx) => rx.test(parsed.number))) {
    return { ok: false, reason: "Please enter a real mobile number" };
  }

  return { ok: true, e164: parsed.number };
}

/** Zod refinement helper for forms. */
export const mobileSchema = z
  .string()
  .trim()
  .min(1, "Mobile number is required")
  .superRefine((val, ctx) => {
    const result = validateMobile(val);
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.reason ?? "Invalid mobile number" });
    }
  })
  .transform((val) => validateMobile(val).e164 ?? val);

export { isValidPhoneNumber };
