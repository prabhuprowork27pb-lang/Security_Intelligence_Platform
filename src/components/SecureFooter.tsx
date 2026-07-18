import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { BRAND } from "@/lib/brand";
import { useUserRole } from "@/hooks/useUserRole";
import IntelligenceLogo from "@/components/IntelligenceLogo";

/**
 * Slim site-wide footer — quiet premium closure.
 * Carries master brand + strap (left), thin link rail (center),
 * micro footer (right), and a discreet Secure Access entry.
 */
export const SecureFooter = () => {
  const { isAdmin } = useUserRole();
  return (
    <footer className="border-t border-border/40 bg-background/60 mt-16 pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-5 py-8 md:py-10 space-y-6">
        {/* Brand row: wordmark + strap (left), thin link rail (center), micro footer (right) */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-12 md:items-start">
          <Link to="/" className="flex items-start gap-3 group md:col-span-5">
            <IntelligenceLogo size={32} className="text-foreground mt-0.5" />
            <div className="leading-tight">
              <p className="font-heading font-semibold text-[15px] tracking-tight text-foreground">
                {BRAND.platformTm} ({BRAND.shortTm})
              </p>
              <p className="text-[11px] text-muted-foreground/85 mt-1.5 max-w-xs leading-relaxed">
                Structured operational intelligence for modern security leadership.
              </p>
            </div>
          </Link>

          <nav
            aria-label="Footer"
            className="md:col-span-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground md:justify-center"
          >
            <Link to="/insights" className="transition-colors hover:text-[hsl(195_100%_45%)]">
              Intelligence Pulse™
            </Link>
            <Link to="/trust" className="transition-colors hover:text-[hsl(12_100%_55%)]">
              Trust &amp; Privacy
            </Link>
            <Link to="/contact" className="transition-colors hover:text-[hsl(320_85%_55%)]">
              Contact
            </Link>
          </nav>


          <div className="md:col-span-3 text-[11px] text-muted-foreground/75 md:text-right">
            {BRAND.microFooter}
          </div>
        </div>

        {/* Quiet sub-row: Admin Login + admin console (when signed in) + Secure Access */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/30 text-[11px] text-muted-foreground/70">
          {isAdmin && (
            <>
              <Link
                to="/dashboard?tab=analytics"
                className="inline-flex items-center gap-1.5 text-secondary/80 hover:text-secondary transition-colors tracking-wide font-medium"
                aria-label="Admin Console"
              >
                <ShieldAlert className="h-3 w-3" />
                Admin Console
              </Link>
              <span aria-hidden className="text-muted-foreground/30">·</span>
            </>
          )}
          <Link
            to="/auth?next=/admin"
            className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors tracking-wide font-medium"
            aria-label="Admin login"
          >
            <ShieldAlert className="h-3 w-3" />
            Admin Login
          </Link>
          <span aria-hidden className="text-muted-foreground/30">·</span>
          <Link
            to="/auth"
            className="text-muted-foreground/55 hover:text-foreground transition-colors tracking-wide"
            aria-label="Operational secure access"
          >
            Secure Access
          </Link>
        </div>

      </div>
    </footer>
  );
};

export default SecureFooter;
