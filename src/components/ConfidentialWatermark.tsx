import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ConfidentialWatermarkProps {
  /** Optional site / asset name to include in the watermark line. */
  siteName?: string;
  /** Optional ISO date string. Defaults to today. */
  dateIso?: string;
  /** When true (default), also renders a faint diagonal background tile. */
  diagonal?: boolean;
  /** When true (default), shows the small confidentiality chip in the bottom-right. */
  chip?: boolean;
  /** Override the displayed user name (used by sample / lead flows). */
  userNameOverride?: string;
  /** Override the displayed email (used by sample / lead flows). */
  emailOverride?: string;
  /** Label shown in the diagonal tile (default: CONFIDENTIAL). */
  label?: string;
}

/**
 * Subtle, fixed-position watermark + diagonal background overlay used on
 * authenticated pages and reports. Purely a UI / traceability layer — does
 * not affect business logic, scoring, or data.
 */
export const ConfidentialWatermark = ({
  siteName,
  dateIso,
  diagonal = true,
  chip = true,
  userNameOverride,
  emailOverride,
  label = "CONFIDENTIAL",
}: ConfidentialWatermarkProps) => {
  const { user } = useAuth();

  const userName = useMemo(() => {
    if (userNameOverride) return userNameOverride;
    const meta = (user?.user_metadata ?? {}) as Record<string, any>;
    return (
      meta.full_name ||
      meta.name ||
      (user?.email ? user.email.split("@")[0] : "Visitor")
    );
  }, [user, userNameOverride]);

  const email = emailOverride ?? user?.email ?? "no-email";
  const date = useMemo(
    () => new Date(dateIso ?? Date.now()).toLocaleString(),
    [dateIso]
  );

  const line = `${label} | Generated for ${userName} (${email})${
    siteName ? ` | ${siteName}` : ""
  } | ${date}`;

  // Soft deterrents — copy notice only. Do NOT block right-click globally.
  const [copyHint, setCopyHint] = useState(false);
  useEffect(() => {
    const onCopy = () => {
      setCopyHint(true);
      window.setTimeout(() => setCopyHint(false), 2200);
    };
    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, []);

  // Tab-switch soft blur on sensitive content (opt-in via .confidential-surface)
  useEffect(() => {
    const onVis = () => {
      document.body.classList.toggle("tab-hidden", document.hidden);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.body.classList.remove("tab-hidden");
    };
  }, []);

  return (
    <>
      {diagonal && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[5] print:hidden"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, transparent 0 180px, hsla(217, 33%, 17%, 0.035) 180px 181px)",
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: "rotate(-24deg)",
              opacity: 0.05,
              fontFamily: "Poppins, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(48px, 9vw, 120px)",
              color: "hsl(217 33% 17%)",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </div>
      )}

      {chip && (
        <div
          aria-hidden
          className="pointer-events-none fixed bottom-2 right-3 z-[6] max-w-[90vw] truncate rounded-md border border-border/40 bg-background/70 px-2.5 py-1 text-[10px] font-mono text-muted-foreground shadow-sm backdrop-blur-sm print:hidden"
          title={line}
        >
          {line}
        </div>
      )}

      {/* Copy attempt tooltip */}
      {copyHint && (
        <div
          role="status"
          className="pointer-events-none fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-md border border-border bg-background/95 px-3 py-1.5 text-xs text-foreground shadow-md backdrop-blur"
        >
          This content is confidential and user-specific.
        </div>
      )}
    </>
  );
};

export default ConfidentialWatermark;
