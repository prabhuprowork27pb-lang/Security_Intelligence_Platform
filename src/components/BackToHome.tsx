import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToHomeProps {
  className?: string;
  to?: string;
  label?: string;
}

/**
 * Persistent, elegant "Back to Home" link surfaced on all non-landing pages.
 * Hides automatically on the landing route ("/").
 */
export const BackToHome = ({ className, to = "/", label = "Back to Home" }: BackToHomeProps) => {
  const { pathname } = useLocation();
  if (pathname === "/") return null;
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium tracking-tight text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
};

export default BackToHome;
