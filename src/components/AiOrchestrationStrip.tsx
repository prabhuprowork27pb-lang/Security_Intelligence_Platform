import { Brain, Sparkles, LineChart, MessagesSquare, Workflow } from "lucide-react";

interface Item {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
}

const ITEMS: Item[] = [
  { icon: Brain, label: "Reviewed Insights", detail: "Consultant-grade narrative" },
  { icon: MessagesSquare, label: "SMARTY Copilot", detail: "Contextual Q&A on results" },
  { icon: Workflow, label: "30/60/90 Roadmap", detail: "Phased remediation plan" },
  { icon: LineChart, label: "Predictive Posture", detail: "Trend & drift signals" },
];

interface AiOrchestrationStripProps {
  className?: string;
}

/**
 * Presentation-only strip describing the AI orchestration layer.
 * No data dependencies; safe to drop anywhere.
 */
const AiOrchestrationStrip = ({ className = "" }: AiOrchestrationStripProps) => {
  return (
    <div
      className={`rounded-md border border-border/60 bg-card/60 px-4 py-3 ${className}`}
      aria-label="AI orchestration layer"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-secondary" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Intelligence Orchestration Layer
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ITEMS.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-2">
            <div className="p-1.5 rounded-md bg-secondary/10 text-secondary shrink-0">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug truncate">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiOrchestrationStrip;
