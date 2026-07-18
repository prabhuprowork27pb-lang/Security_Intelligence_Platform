import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Home,
  FileText,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  LogIn,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  Users,
  Mail,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND } from "@/lib/brand";

interface MobileNavProps {
  onNavigate?: () => void;
}

const ITEMS_PUBLIC = [
  { to: "/", label: "Home", icon: Home },
  { to: "/why", label: "Why We Built This", icon: HelpCircle },
  { to: "/insights", label: "Intelligence Insights", icon: Briefcase },
  { to: "/sample", label: "Sample Reports", icon: FileText },
  { to: "/diagnostic/start", label: BRAND.primary, icon: ShieldCheck },
  { to: "/studio", label: BRAND.premium, icon: Briefcase },
  { to: "/founder", label: "Founder", icon: UserCircle2 },
  { to: "/community", label: "Join the Intelligent Community", icon: Users },
  { to: "/trust", label: "Trust & Privacy", icon: ShieldCheck },
  { to: "/contact", label: "Contact Us", icon: Mail },
];

const ITEMS_AUTH = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/sample", label: "Sample Reports", icon: FileText },
  { to: "/studio", label: BRAND.premium, icon: Briefcase },
  { to: "/help", label: "Guide", icon: HelpCircle },
];

/**
 * Mobile navigation drawer. Triggered from SiteHeader on small screens.
 * Provides quick access to primary routes and the sign-in / diagnostic CTAs.
 */
export const MobileNav = (_props: MobileNavProps) => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const items = user ? ITEMS_AUTH : ITEMS_PUBLIC;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 -mr-2"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[86vw] max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-border/40 text-left">
          <SheetTitle className="font-heading text-base">
            {BRAND.platformTm}
          </SheetTitle>
          <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold">
            {BRAND.shortTm} · {BRAND.shortMeaning}
          </p>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const { to, label, icon: Icon } = item;
              const external = (item as { external?: boolean }).external;
              const active = !external && (pathname === to || (to !== "/" && pathname.startsWith(to)));
              const cls = cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium min-h-[44px] transition-colors",
                active
                  ? "bg-muted/50 text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
              );
              return (
                <li key={to}>
                  {external ? (
                    <a href={to} className={cls}>
                      <Icon className="h-4 w-4 text-secondary" />
                      {label}
                    </a>
                  ) : (
                    <Link to={to} className={cls}>
                      <Icon className="h-4 w-4 text-secondary" />
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 border-t border-border/40 space-y-2">
          {user ? (
            <Button
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <>
              <Button asChild className="w-full min-h-[48px] text-base">
                <Link to="/diagnostic/start">
                  Take a Security Selfie™
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full min-h-[44px]">
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            </>
          )}
          <p className="text-[10px] text-center text-muted-foreground/70 pt-1">
            {BRAND.trustTrio}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
