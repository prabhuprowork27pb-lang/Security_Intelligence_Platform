import { useState } from "react";
import { Mail, MessageCircle, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  source?: string;
  variant?: "card" | "inline" | "dark";
  className?: string;
}

type Channel = "email" | "whatsapp";

/**
 * Intelligence Pulse™ subscription. Accepts either email or WhatsApp number —
 * any verified inbox is fine; we never require a corporate domain.
 * Persists to public.intelligence_pulse_subscribers.
 */
export const IntelligencePulseSignup = ({
  source = "site",
  variant = "card",
  className,
}: Props) => {
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const dark = variant === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { source, channel };
    if (channel === "email") {
      if (!email.trim()) return;
      payload.email = email.trim();
    } else {
      const cleaned = phone.trim();
      if (!/^\+?[0-9 \-]{7,20}$/.test(cleaned)) {
        toast({
          title: "Check your number",
          description:
            "Please enter a valid WhatsApp number including country code.",
          variant: "destructive",
        });
        return;
      }
      payload.phone = cleaned;
    }

    setLoading(true);
    const { error } = await supabase
      .from("intelligence_pulse_subscribers" as never)
      .insert(payload as never);
    setLoading(false);

    if (error && !/duplicate|unique/i.test(error.message)) {
      toast({
        title: "Could not subscribe",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    setDone(true);
    setEmail("");
    setPhone("");
    toast({
      title: "Subscribed to Intelligence Pulse™",
      description:
        channel === "email"
          ? "You'll receive our weekly operational intelligence brief by email."
          : "You'll receive our weekly brief on WhatsApp.",
    });
  };

  return (
    <div
      className={cn(
        variant === "card"
          ? "rounded-2xl border border-border/60 bg-card p-7 md:p-9"
          : variant === "dark"
            ? "rounded-2xl bg-foreground text-background p-7 md:p-10 border border-background/10"
            : "py-2",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles
          className={cn(
            "h-4 w-4",
            dark ? "text-background/70" : "text-secondary",
          )}
        />
        <p
          className={cn(
            "text-[11px] uppercase tracking-[0.25em] font-semibold",
            dark ? "text-background/70" : "text-secondary",
          )}
        >
          Intelligence Pulse™
        </p>
      </div>
      <h3
        className={cn(
          "font-heading text-2xl md:text-3xl font-semibold leading-tight tracking-tight mb-3",
          dark ? "text-background" : "text-foreground",
        )}
      >
        A weekly operational intelligence brief — for security leaders.
      </h3>
      <p
        className={cn(
          "text-sm md:text-base leading-relaxed mb-5",
          dark ? "text-background/70" : "text-muted-foreground",
        )}
      >
        Curated advisories, maturity insights, governance signals and India
        operational observations. Calibrated. Non-promotional. One brief a week.
      </p>

      {/* Channel toggle */}
      <div
        className={cn(
          "inline-flex rounded-lg p-1 mb-4 text-[12px]",
          dark ? "bg-background/[0.08]" : "bg-muted/60",
        )}
        role="tablist"
        aria-label="Delivery channel"
      >
        {(
          [
            { id: "email" as Channel, label: "Email", Icon: Mail },
            { id: "whatsapp" as Channel, label: "WhatsApp", Icon: MessageCircle },
          ]
        ).map(({ id, label, Icon }) => {
          const active = channel === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setChannel(id);
                setDone(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors",
                active
                  ? dark
                    ? "bg-background text-foreground"
                    : "bg-background text-foreground shadow-sm"
                  : dark
                    ? "text-background/60 hover:text-background"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2"
        aria-label="Subscribe to Intelligence Pulse"
      >
        <div className="relative flex-1">
          {channel === "email" ? (
            <>
              <Mail
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                  dark ? "text-background/50" : "text-muted-foreground",
                )}
              />
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@anywhere.com — any verified inbox"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "pl-9 h-11",
                  dark &&
                    "bg-background/[0.06] border-background/20 text-background placeholder:text-background/40 focus-visible:ring-background/40",
                )}
                disabled={loading || done}
              />
            </>
          ) : (
            <>
              <MessageCircle
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                  dark ? "text-background/50" : "text-muted-foreground",
                )}
              />
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="+91 98xxxxxxxx — WhatsApp-enabled number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cn(
                  "pl-9 h-11",
                  dark &&
                    "bg-background/[0.06] border-background/20 text-background placeholder:text-background/40 focus-visible:ring-background/40",
                )}
                disabled={loading || done}
              />
            </>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={loading || done}
          className={cn(
            "h-11",
            dark && "bg-background text-foreground hover:bg-background/90",
          )}
        >
          {done ? "Subscribed" : loading ? "Subscribing…" : "Subscribe"}
          {!done && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>

      <p
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em]",
          dark ? "text-background/45" : "text-muted-foreground/70",
        )}
      >
        <ShieldCheck className="h-3 w-3" />
        Any verified inbox accepted. No vendor noise. Unsubscribe anytime.
      </p>
    </div>
  );
};

export default IntelligencePulseSignup;
