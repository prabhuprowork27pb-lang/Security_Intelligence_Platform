import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

/**
 * Persistent CTA that fades in once the user scrolls past the hero.
 * Hides when near the page footer to avoid double CTAs.
 */
export const FloatingCta = ({ label = "Take a Security Selfie™" }: { label?: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > window.innerHeight * 0.6 && y < max - 240);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-40 transition-all duration-500",
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <Button
        size="lg"
        onClick={() => navigate(user ? "/dashboard" : "/diagnostic/start")}
        className="h-12 px-6 rounded-full shadow-[0_20px_60px_-15px_hsl(214_89%_53%/0.6)] bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-[0_25px_70px_-15px_hsl(214_89%_53%/0.85)] hover:-translate-y-0.5 transition-all"
      >
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default FloatingCta;
