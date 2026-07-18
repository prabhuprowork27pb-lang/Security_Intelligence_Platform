import { useLocation } from "react-router-dom";
import { FloatingCta } from "./FloatingCta";

/**
 * Globally mounted CTA. Hidden on routes where it would interfere
 * (auth flows, in-progress assessment wizard, print/PDF surfaces).
 */
const HIDDEN_PREFIXES = [
  "/auth",
  "/reset-password",
  "/print-preview",
  "/pdf-report",
  "/assessments/",
  "/sites/",
  "/organisations/",
  "/admin",
  "/leads",
  "/debug",
  "/unlock",
];

export const GlobalCta = () => {
  const { pathname } = useLocation();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <FloatingCta label="Take a Security Selfie™" />;
};

export default GlobalCta;
