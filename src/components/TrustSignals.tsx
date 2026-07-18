import { ShieldCheck, FileLock2, Fingerprint } from "lucide-react";

/**
 * TrustSignals
 * Slim enterprise trust strip — confidentiality, access, audit.
 * Standards alignment lives in the report's standards block, not here.
 */
const SIGNALS = [
  { icon: ShieldCheck,  label: "Confidential" },
  { icon: FileLock2,    label: "Access-controlled" },
  { icon: Fingerprint,  label: "Audit-tracked" },
];

export const TrustSignals = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground ${className}`}
    >
      {SIGNALS.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-secondary/80" />
          <span className="tracking-wide">{label}</span>
        </span>
      ))}
    </div>
  );
};

export default TrustSignals;
