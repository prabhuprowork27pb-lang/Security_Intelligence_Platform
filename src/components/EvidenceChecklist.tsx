import { Card } from "@/components/ui/card";
import { ClipboardCheck, FileText, ListChecks, Users } from "lucide-react";
import { getEvidenceFor } from "@/lib/evidenceChecklist";

interface DomainScoreLite {
  domain_key: string;
  domain_name: string;
  score_0_100: number;
}

interface EvidenceChecklistProps {
  domains: DomainScoreLite[];
  /** Domains below this score are surfaced. Default 71 (below "Effective"). */
  threshold?: number;
  /** Compact rendering for PDF / print. */
  compact?: boolean;
}

export const EvidenceChecklist = ({ domains, threshold = 71, compact = false }: EvidenceChecklistProps) => {
  const lowDomains = (domains ?? []).filter((d) => d.score_0_100 < threshold);
  if (lowDomains.length === 0) return null;

  return (
    <Card className={compact ? "p-6" : "p-8"}>
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className={`font-heading font-bold ${compact ? "text-lg" : "text-2xl"}`}>
            Evidence to bring to your next review
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            For each domain scoring below the Effective threshold, the items below are what an internal reviewer or external auditor would typically ask to see. Use this as a working list — gather, verify, and close the gap before your next quarterly review.
          </p>
        </div>
      </div>

      <div className={compact ? "space-y-5" : "space-y-6"}>
        {lowDomains.map((d) => {
          const ev = getEvidenceFor(d.domain_key);
          return (
            <div key={d.domain_key} className="border-l-2 border-secondary/40 pl-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="font-heading font-semibold text-base">{d.domain_name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                  Score {Math.round(d.score_0_100)}/100
                </span>
              </div>
              <div className={compact ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-3 gap-4"}>
                <Section icon={<FileText className="h-4 w-4" />} title="Documents to collect" items={ev.documents} />
                <Section icon={<ListChecks className="h-4 w-4" />} title="Logs & records to review" items={ev.logsAndRecords} />
                <Section icon={<Users className="h-4 w-4" />} title="Interviews to conduct" items={ev.interviews} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const Section = ({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: { label: string; detail?: string }[];
}) => (
  <div>
    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
      <span className="text-secondary">{icon}</span>
      {title}
    </div>
    <ul className="space-y-1.5">
      {items.map((it, idx) => (
        <li key={idx} className="text-xs text-foreground/85 flex gap-2">
          <span className="text-muted-foreground mt-0.5">□</span>
          <span>
            {it.label}
            {it.detail && <span className="block text-muted-foreground">{it.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  </div>
);
