import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface PriorityFinding {
  code: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  title: string;
  evidence: string;
  action_30d: string;
  investment_inr_min: number;
  investment_inr_max: number;
}
interface RegulatoryRow {
  standard: string;
  applies: boolean;
  status: "compliant" | "gap" | "partial" | "not_applicable";
  note: string;
}
interface ValidatedPayload {
  specialist_commentary?: Array<{ domain: string; score: number; commentary: string }>;
  regulatory_alignment?: RegulatoryRow[];
  peer_benchmark?: {
    archetype: string; site_score: number; peer_median: number;
    peer_p25: number; peer_p75: number; sample_size: number;
    sample_note: string; narrative: string;
  };
  priority_findings?: PriorityFinding[];
}

interface Props {
  status: string | null;
  readyAt: string | null;
  generatedBy: string | null;
  payload: ValidatedPayload | null;
}


const SEVERITY_TONE: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Medium: "bg-secondary/15 text-secondary border-secondary/30",
  Low: "bg-muted text-muted-foreground border-border",
};

const STATUS_TONE: Record<string, string> = {
  compliant: "bg-accent/15 text-accent border-accent/30",
  partial: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  gap: "bg-destructive/15 text-destructive border-destructive/30",
  not_applicable: "bg-muted text-muted-foreground border-border",
};

const ValidatedReportSection = ({ status, readyAt, generatedBy, payload }: Props) => {
  if (status !== "ready" || !payload) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-accent/30 bg-accent/[0.05] px-4 py-3 flex items-center gap-3 flex-wrap">
        <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-foreground">Specialist Validated — Reviewed and validated by the SIP™ Advisory Team</p>
          <p className="text-xs text-muted-foreground">
            {readyAt ? new Date(readyAt).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
            {generatedBy === "auto_escalated" ? " · Auto-released under 24h SLA" : ""}
          </p>
        </div>
        <Badge className="bg-accent/15 text-accent border-accent/30">SIP™ Advisory Team</Badge>
      </div>

      {payload.specialist_commentary && payload.specialist_commentary.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-semibold mb-3">Specialist Commentary</h3>
            <div className="space-y-3">
              {payload.specialist_commentary.map((c, i) => (
                <div key={i} className="border-l-2 border-secondary/40 pl-3">
                  <p className="text-xs uppercase tracking-wider text-secondary font-semibold">
                    {c.domain.replace(/_/g, " ")} · {Math.round(c.score)}/100
                  </p>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">{c.commentary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {payload.regulatory_alignment && payload.regulatory_alignment.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-semibold mb-1">Regulatory Alignment — India</h3>
            <p className="text-[11px] italic text-muted-foreground mb-3">Alignment direction only — not a certification or legal opinion.</p>
            <div className="space-y-2">
              {payload.regulatory_alignment.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-start text-sm border-b border-border/40 last:border-0 pb-2">
                  <div className="col-span-3 font-medium">{r.standard}</div>
                  <div className="col-span-2">
                    <Badge variant="outline" className={STATUS_TONE[r.status] ?? ""}>
                      {r.status === "not_applicable" ? "N/A" : r.status}
                    </Badge>
                  </div>
                  <div className="col-span-7 text-muted-foreground">{r.note}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {payload.peer_benchmark && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-semibold mb-1">Peer Benchmark</h3>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              {payload.peer_benchmark.archetype} · {payload.peer_benchmark.sample_note}
            </p>
            <div className="grid grid-cols-4 gap-3 text-center mb-3">
              <Metric label="This site" value={payload.peer_benchmark.site_score} highlight />
              <Metric label="Peer p25" value={payload.peer_benchmark.peer_p25} />
              <Metric label="Peer median" value={payload.peer_benchmark.peer_median} />
              <Metric label="Peer p75" value={payload.peer_benchmark.peer_p75} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{payload.peer_benchmark.narrative}</p>
          </CardContent>
        </Card>
      )}

      {payload.priority_findings && payload.priority_findings.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-secondary" /> Priority Findings
            </h3>
            <div className="space-y-3">
              {payload.priority_findings.map((f) => (
                <div key={f.code} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-secondary">{f.code}</span>
                      <Badge variant="outline" className={SEVERITY_TONE[f.severity]}>{f.severity}</Badge>
                      <span className="font-medium text-foreground">{f.title}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1"><strong className="text-foreground">Evidence:</strong> {f.evidence}</p>
                  <p className="text-xs text-muted-foreground"><strong className="text-foreground">30-day action:</strong> {f.action_30d}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Metric = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-md p-2 ${highlight ? "bg-secondary/10 border border-secondary/30" : "bg-muted/40"}`}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`font-heading text-xl font-semibold ${highlight ? "text-secondary" : "text-foreground"}`}>{Math.round(value)}</p>
  </div>
);

export default ValidatedReportSection;
