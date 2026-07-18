import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PulseItem {
  id: string;
  title: string;
  url: string;
  published_at: string | null;
  fetched_at: string | null;
  ai_tags: any;
  pulse_sources: { name: string } | null;
}

interface SignalsFromTheFieldProps {
  variant?: "section" | "embed";
}

const HUE_BY_SEVERITY: Record<number, string> = {
  1: "hsl(195 100% 60%)",
  2: "hsl(78 85% 58%)",
  3: "hsl(38 100% 62%)",
  4: "hsl(12 100% 68%)",
  5: "hsl(0 85% 65%)",
};

const SEVERITY_TAG: Record<number, string> = {
  1: "Informational",
  2: "Notable",
  3: "Elevated",
  4: "High",
  5: "Critical",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1mo ago" : `${months}mo ago`;
}

export const SignalsFromTheField = ({ variant = "section" }: SignalsFromTheFieldProps) => {
  const [items, setItems] = useState<PulseItem[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Only surface signals from the last 15 days so the homepage never
      // shows stale field intelligence. Older items remain in the database
      // for archival but are not featured.
      const FRESHNESS_WINDOW_DAYS = 15;
      const cutoff = new Date(Date.now() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("pulse_raw_items" as any)
        .select("id, title, url, published_at, fetched_at, ai_tags, pulse_sources(name)")
        .eq("status", "tagged")
        .or(`published_at.gte.${cutoff},fetched_at.gte.${cutoff}`)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("fetched_at", { ascending: false })
        .limit(6);
      const rows = (data ?? []) as unknown as PulseItem[];
      setItems(rows);
      if (rows.length > 0) {
        const max = rows.reduce<string | null>((acc, r) => {
          const t = r.fetched_at ?? r.published_at;
          if (!t) return acc;
          return !acc || new Date(t) > new Date(acc) ? t : acc;
        }, null);
        setLastUpdated(max);
      }
    })();
  }, []);

  const wrapperCls =
    variant === "section"
      ? "border-y border-border/40 bg-foreground text-background"
      : "rounded-2xl bg-foreground text-background";
  const innerCls =
    variant === "section"
      ? "container mx-auto px-5 md:px-6 py-16 md:py-24 max-w-6xl"
      : "px-6 md:px-10 py-12 md:py-14";

  // Signals are "stale" when the freshest item is older than 15 days.
  const isStale = !!(
    items && items.length > 0 && items[0].published_at
      ? Date.now() - new Date(items[0].published_at).getTime() > 15 * 24 * 60 * 60 * 1000
      : false
  );

  return (
    <section className={wrapperCls}>
      <div className={innerCls}>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-background/60 font-semibold mb-3">
              <Radio className="h-3.5 w-3.5" />
              Signals from the Field™
              {isStale && (
                <span className="inline-flex items-center rounded-md border border-amber-300/60 bg-amber-300/10 px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-amber-200 normal-case">
                  Content refresh due
                </span>
              )}
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-[1.05] max-w-2xl">
              Short-form intelligence. Drawn from the operating edge.
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-background/55 max-w-xs leading-relaxed">
              Live signals from the Intelligence Pulse — curated from open-source
              security and resilience sources.
            </p>
            {lastUpdated && (
              <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-background/45">
                Last updated · {new Date(lastUpdated).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
        </div>

        {items === null && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-background/15 bg-background/[0.04] animate-pulse"
              />
            ))}
          </div>
        )}

        {items !== null && items.length === 0 && (
          <p className="text-sm text-background/55">
            The Pulse will refresh shortly. Check back soon.
          </p>
        )}

        {items !== null && items.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {items.map((s, i) => {
              const sev = Number(s.ai_tags?.severity) || 1;
              const h = HUE_BY_SEVERITY[sev] ?? HUE_BY_SEVERITY[1];
              const tag = SEVERITY_TAG[sev] ?? "Signal";
              const num = `S/${String(i + 1).padStart(2, "0")}`;
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl border border-background/15 bg-background/[0.04] hover:bg-background/[0.08] transition-colors p-6 md:p-7 overflow-hidden block"
                >
                  <span className="absolute top-0 left-0 h-full w-[3px]" style={{ background: h }} />
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-background/55">{num}</span>
                    <span
                      className="text-[9px] uppercase tracking-[0.2em] rounded-md px-2 py-0.5 font-semibold"
                      style={{ color: h, borderColor: h, borderWidth: 1, borderStyle: "solid" }}
                    >
                      {tag}
                    </span>
                  </div>
                  <p className="font-heading text-[15px] md:text-[16px] leading-snug text-background line-clamp-4">
                    {s.title}
                  </p>
                  <div className="mt-6 pt-4 border-t border-background/15 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-background/40">
                    <span className="truncate max-w-[60%]">{s.pulse_sources?.name ?? "Field intelligence"}</span>
                    <span>{timeAgo(s.published_at ?? s.fetched_at)}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default SignalsFromTheField;
