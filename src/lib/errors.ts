/**
 * humaniseError — converts any thrown error / Supabase response into
 * executive-friendly copy. Never leaks raw error messages or stack traces.
 *
 * Returns:
 *   title       — short headline for the toast
 *   description — one or two sentences explaining what happened
 *   recovery    — optional next-step hint
 */

type AnyErr =
  | { message?: string; code?: string; status?: number; name?: string }
  | string
  | null
  | undefined;

export interface HumanisedError {
  title: string;
  description: string;
  recovery?: string;
}

const NETWORK_HINTS = [
  "failed to fetch",
  "networkerror",
  "load failed",
  "network request failed",
  "fetch failed",
];

export function humaniseError(err: AnyErr, context?: string): HumanisedError {
  const raw =
    typeof err === "string"
      ? err
      : (err as any)?.message ?? (err as any)?.error_description ?? "";
  const code = (err as any)?.code ?? "";
  const status = (err as any)?.status;
  const name = (err as any)?.name ?? "";
  const lower = String(raw).toLowerCase();

  // Network / offline
  if (NETWORK_HINTS.some((h) => lower.includes(h)) || name === "TypeError") {
    return {
      title: "We couldn't reach our servers",
      description:
        "Your information is safe. The platform is having trouble connecting right now.",
      recovery: "Please check your connection and try again in a moment.",
    };
  }

  // Auth-specific
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    code === "invalid_credentials"
  ) {
    return {
      title: "Sign-in didn't go through",
      description: "The email or verification code didn't match our records.",
      recovery: "Please request a fresh verification code.",
    };
  }
  if (lower.includes("token has expired") || lower.includes("otp_expired")) {
    return {
      title: "Verification code expired",
      description: "Sign-in codes are valid for 10 minutes for your security.",
      recovery: "Please request a fresh code and try again.",
    };
  }
  if (lower.includes("rate limit") || status === 429) {
    return {
      title: "Just a moment",
      description: "We've received a lot of requests in a short time.",
      recovery: "Please wait a few seconds before trying again.",
    };
  }
  if (status === 401 || lower.includes("not authenticated") || lower.includes("jwt")) {
    return {
      title: "Your session has timed out",
      description: "For your security, we've signed you out after a period of inactivity.",
      recovery: "Please sign in again to continue.",
    };
  }
  if (status === 403 || lower.includes("not authorized") || lower.includes("permission denied")) {
    return {
      title: "You don't have access to this",
      description: "This content is restricted to its owner or your administrator.",
    };
  }

  // Postgres / Supabase guard errors
  if (lower.includes("assessment_blocked")) {
    // surfaced from can_user_start_assessment
    const msg = raw.split(":").slice(1).join(":").trim() || "This assessment can't be started right now.";
    return {
      title: "We can't start this Security Selfie™ yet",
      description: msg,
    };
  }
  if (code === "23505" || lower.includes("duplicate key")) {
    return {
      title: "This already exists",
      description: "An entry with the same details is already saved against your account.",
    };
  }
  if (code === "23503" || lower.includes("foreign key")) {
    return {
      title: "Something's missing",
      description: "A required link to another record wasn't found. Please refresh and try again.",
    };
  }
  if (code === "PGRST301" || lower.includes("rls")) {
    return {
      title: "Access denied",
      description: "Your account doesn't have permission to view or change this record.",
    };
  }

  // Server / edge-function errors
  if (status && status >= 500) {
    return {
      title: "Our systems are catching up",
      description: "Your information is safe. The platform encountered a temporary issue.",
      recovery: "Please try again in a minute. We've logged the incident.",
    };
  }

  // Context-aware fallback
  const contextHeadlines: Record<string, string> = {
    save: "We couldn't save your changes",
    submit: "We couldn't submit your Security Selfie™",
    download: "We couldn't prepare your report",
    auth: "Sign-in didn't go through",
    profile: "We couldn't update your profile",
    studio: "We couldn't send your Security Studio™ enquiry",
  };

  return {
    title: contextHeadlines[context ?? ""] ?? "Something didn't go through",
    description:
      "Your information is safe. The platform ran into a brief hiccup completing this action.",
    recovery: "Please try again in a moment. If this keeps happening, contact us through the Help page.",
  };
}

/** Convenience: returns a payload ready to spread into the sonner / shadcn toast. */
export function errorToast(err: AnyErr, context?: string) {
  const h = humaniseError(err, context);
  return {
    title: h.title,
    description: h.recovery ? `${h.description} ${h.recovery}` : h.description,
    variant: "destructive" as const,
  };
}
