import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  LogIn,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import BackToHome from "@/components/BackToHome";
import MobileNav from "@/components/MobileNav";
import IntelligenceLogo from "@/components/IntelligenceLogo";

interface SiteHeaderProps {
  homeHash?: string;
}

type Tab = { label: string; to: string; external?: boolean };

const CORE_TABS: Tab[] = [
  { label: "Why We Built This", to: "/why" },
  { label: "Intelligence Insights", to: "/insights" },
  { label: "Sample Reports", to: "/sample" },
  { label: "Security Selfie™", to: "/diagnostic/start" },
  { label: "Security Studio™", to: "/studio" },
];

const MORE_TABS: Tab[] = [
  { label: "Founder", to: "/founder" },
  { label: "Join the Intelligent Community", to: "/community" },
  { label: "Trust & Privacy", to: "/trust" },
  { label: "Contact Us", to: "/contact" },
];

export const SiteHeader = ({ homeHash }: SiteHeaderProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (to: string) =>
    pathname === to || (to !== "/" && pathname.startsWith(to));

  const showBack = pathname !== "/";

  return (
    <header className="border-b border-border/40 bg-background/85 backdrop-blur-xl sticky top-0 z-50">
      {showBack && (
        <div className="border-b border-border/30 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6 py-1.5">
            <BackToHome />
          </div>
        </div>
      )}
      <div className="container mx-auto flex items-center justify-between gap-4 lg:gap-8 px-4 md:px-6 py-4 md:py-5">
        {/* Master brand */}
        <Link
          to={homeHash ? `/${homeHash}` : "/"}
          className="flex items-center gap-3 md:gap-3.5 group min-w-0 "
          aria-label={`${BRAND.platformTm} — ${BRAND.shortTm}`}
        >
          <IntelligenceLogo
            size={40}
            className="text-foreground transition-transform group-hover:scale-[1.04]"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-heading font-semibold text-[15px] sm:text-[17px] md:text-[19px] tracking-tight text-foreground inline-flex items-center gap-1.5 sm:gap-2">
              <span className="sm:hidden">SIP</span>
              <span className="hidden sm:inline">Security Intelligence Platform</span>
              <sup className="text-[9px] font-medium text-secondary ml-0.5">™</sup>
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.28em] text-secondary font-semibold -mt-0.5 truncate">
              {BRAND.shortTm} · {BRAND.shortMeaning}
            </span>
          </div>
        </Link>

        {/* Primary navigation — desktop */}
        {!user && (
          <nav className="hidden xl:flex items-center gap-0 flex-1 justify-end">
            {CORE_TABS.map((t) => {
              const active = !t.external && isActive(t.to);
              const linkClass = cn(
                "group relative px-2.5 py-2.5 text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              );
              const underline = (
                <span
                  className={cn(
                    "pointer-events-none absolute left-2.5 right-2.5 -bottom-[3px] h-[2px] rounded-full bg-secondary transition-all duration-300",
                    active
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-50 group-hover:opacity-70 group-hover:scale-x-100",
                  )}
                />
              );
              return t.external ? (
                <a key={t.to} href={t.to} className={linkClass}>
                  {t.label}
                  {underline}
                </a>
              ) : (
                <Link key={t.to} to={t.to} className={linkClass}>
                  {t.label}
                  {underline}
                </Link>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "group relative inline-flex items-center gap-1 px-2.5 py-2.5 text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors outline-none",
                    MORE_TABS.some((t) => isActive(t.to))
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  More <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {MORE_TABS.map((t) => (
                  <DropdownMenuItem key={t.to} asChild>
                    <Link to={t.to} className="w-full cursor-pointer">
                      {t.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        )}

        {user && (
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <Link
              to="/dashboard"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-md transition-colors",
                isActive("/dashboard")
                  ? "text-foreground bg-muted/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              )}
            >
              <LayoutDashboard className="h-4 w-4" /> Command Centre
            </Link>
            <Link
              to="/sample"
              className="px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              Sample Reports
            </Link>
            <Link
              to="/insights"
              className="px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              Insights
            </Link>
            <Link
              to="/studio"
              className="px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              Studio™
            </Link>
          </nav>
        )}

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="inline-flex text-[13px] text-muted-foreground hover:text-foreground mr-3 md:mr-12"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="inline-flex text-[13px] text-muted-foreground hover:text-foreground border-border/80 mr-3 md:mr-12"
            >
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
          )}

          <MobileNav />
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
