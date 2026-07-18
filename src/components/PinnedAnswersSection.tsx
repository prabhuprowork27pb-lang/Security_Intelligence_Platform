import { Card } from "@/components/ui/card";
import { Pin } from "lucide-react";
import { SmartyActionCards } from "@/components/SmartyActionCards";

export interface PinnedAnswer {
  id: string;
  question: string;
  answer: string;
  domain_key?: string | null;
  domain_name?: string | null;
  created_at?: string;
}

interface PinnedAnswersSectionProps {
  pinned: PinnedAnswer[];
  /** Hide action cards for the compact PDF rendering. */
  compact?: boolean;
}

export const PinnedAnswersSection = ({ pinned, compact = false }: PinnedAnswersSectionProps) => {
  if (!pinned || pinned.length === 0) return null;

  return (
    <Card className={compact ? "p-6" : "p-8"}>
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
          <Pin className="h-5 w-5" />
        </div>
        <div>
          <h2 className={`font-heading font-bold ${compact ? "text-lg" : "text-2xl"}`}>
            Pinned Advisor Notes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            SMARTY responses pinned by the assessor as part of this consulting-style report.
          </p>
        </div>
      </div>
      <div className="space-y-5">
        {pinned.map((p) => (
          <div key={p.id} className="border-l-2 border-secondary/40 pl-4">
            {p.domain_name && (
              <span className="inline-block text-[10px] uppercase tracking-wider text-secondary font-semibold mb-1">
                {p.domain_name}
              </span>
            )}
            <p className="text-sm font-semibold text-foreground mb-1">Q. {p.question}</p>
            <p className="text-sm text-foreground/85 whitespace-pre-wrap">{p.answer}</p>
            {!compact && <SmartyActionCards answer={p.answer} domainName={p.domain_name ?? undefined} />}
          </div>
        ))}
      </div>
    </Card>
  );
};
