import { Card } from "@/components/ui/card";
import { AlertTriangle, Target, ShieldAlert, ClipboardCheck, Sparkles } from "lucide-react";

interface SmartyActionCardsProps {
  answer: string;
  domainName?: string;
}

interface Parsed {
  rootCauses: string[];
  risks: string[];
  d30: string[];
  d60: string[];
  d90: string[];
  evidence: string[];
}

const HEADERS = {
  rootCauses: /(root\s*causes?|likely\s+root\s+causes?|why\s+the\s+score)/i,
  risks: /(operational\s+risks?|risks?\s+(it|they)\s+create|business\s+risks?)/i,
  d30: /(30[-\s]?day|first\s+30|next\s+30)/i,
  d60: /(60[-\s]?day|next\s+60|31[\s\-–]*60)/i,
  d90: /(90[-\s]?day|next\s+90|61[\s\-–]*90)/i,
  evidence: /(evidence|validate\s+improvement|what\s+evidence)/i,
};

const stripBullet = (line: string) =>
  line.replace(/^[\s>•\-–—*]+/, "").replace(/^\d+[\.)]\s*/, "").replace(/\*\*/g, "").trim();

const parseSmartyAnswer = (text: string): Parsed => {
  const out: Parsed = { rootCauses: [], risks: [], d30: [], d60: [], d90: [], evidence: [] };
  if (!text) return out;

  const lines = text.split(/\r?\n/);
  let bucket: keyof Parsed | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Heading detection (markdown # / numbered / bold heading-like lines)
    const headingLike =
      /^#+\s/.test(line) ||
      /^\*\*[^*]+\*\*\s*:?$/.test(line) ||
      /^[A-Z0-9 ()/–-]+:?$/.test(line) ||
      /^\d+[\.)]\s*[A-Z]/.test(line);

    if (headingLike) {
      const h = line.replace(/[#*]/g, "").trim();
      if (HEADERS.rootCauses.test(h)) { bucket = "rootCauses"; continue; }
      if (HEADERS.risks.test(h)) { bucket = "risks"; continue; }
      if (HEADERS.d30.test(h)) { bucket = "d30"; continue; }
      if (HEADERS.d60.test(h)) { bucket = "d60"; continue; }
      if (HEADERS.d90.test(h)) { bucket = "d90"; continue; }
      if (HEADERS.evidence.test(h)) { bucket = "evidence"; continue; }
    }

    if (!bucket) continue;
    // Collect bulleted / numbered / plain lines under the active bucket.
    const isBullet = /^[\s>•\-–—*]+/.test(line) || /^\d+[\.)]\s+/.test(line);
    if (isBullet || out[bucket].length > 0) {
      const cleaned = stripBullet(line);
      if (cleaned) out[bucket].push(cleaned);
    }
  }

  // Trim each bucket to a sensible cap
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => {
    out[k] = out[k].slice(0, 8);
  });
  return out;
};

const hasAny = (p: Parsed) =>
  p.rootCauses.length + p.risks.length + p.d30.length + p.d60.length + p.d90.length + p.evidence.length > 0;

export const SmartyActionCards = ({ answer, domainName }: SmartyActionCardsProps) => {
  const parsed = parseSmartyAnswer(answer);
  if (!hasAny(parsed)) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-secondary font-semibold">
        <Sparkles className="h-3.5 w-3.5" />
        Security Studio™ Action Cards
        {domainName && <span className="text-muted-foreground normal-case tracking-normal font-normal">· {domainName}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {parsed.rootCauses.length > 0 && (
          <ActionCard
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Root Causes"
            tone="amber"
            items={parsed.rootCauses}
          />
        )}
        {parsed.risks.length > 0 && (
          <ActionCard
            icon={<ShieldAlert className="h-4 w-4" />}
            title="Operational Risks"
            tone="red"
            items={parsed.risks}
          />
        )}
        {parsed.d30.length > 0 && (
          <ActionCard icon={<Target className="h-4 w-4" />} title="Next 30 Days" tone="teal" items={parsed.d30} />
        )}
        {parsed.d60.length > 0 && (
          <ActionCard icon={<Target className="h-4 w-4" />} title="Next 60 Days" tone="teal" items={parsed.d60} />
        )}
        {parsed.d90.length > 0 && (
          <ActionCard icon={<Target className="h-4 w-4" />} title="Next 90 Days" tone="teal" items={parsed.d90} />
        )}
        {parsed.evidence.length > 0 && (
          <ActionCard
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="Evidence to Validate"
            tone="navy"
            items={parsed.evidence}
          />
        )}
      </div>
    </div>
  );
};

const TONE: Record<string, string> = {
  amber: "border-l-score-medium bg-score-medium/[0.04]",
  red: "border-l-score-low bg-score-low/[0.04]",
  teal: "border-l-secondary bg-secondary/[0.05]",
  navy: "border-l-primary bg-primary/[0.04]",
};

const ActionCard = ({
  icon,
  title,
  tone,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  tone: keyof typeof TONE;
  items: string[];
}) => (
  <Card className={`p-4 border-l-4 ${TONE[tone]}`}>
    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
      <span className="text-foreground/70">{icon}</span>
      {title}
    </div>
    <ul className="space-y-1.5">
      {items.map((it, idx) => (
        <li key={idx} className="text-xs text-foreground/85 flex gap-2">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  </Card>
);

export { parseSmartyAnswer };
