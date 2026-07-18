import { Link } from "react-router-dom";
import { Shield, Lock, MapPin, Eye } from "lucide-react";

/**
 * Persistent trust ribbon for public + authenticated marketing pages.
 * Reinforces data residency, encryption, RLS, and DPDP alignment without
 * being heavy. Pairs with the dedicated /trust page.
 */
export const TrustRibbon = () => (
  <div className="border-t border-border/60 bg-muted/30">
    <div className="container mx-auto px-6 py-4">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-primary" />
          AES-256 at rest · TLS 1.3 in transit
        </span>
        <span className="hidden sm:inline text-border">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Row-level isolation · your data is yours alone
        </span>
        <span className="hidden sm:inline text-border">|</span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Hosted in-region · DPDP Act 2023 aligned
        </span>
        <span className="hidden sm:inline text-border">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-primary" />
          Zero re-sale, zero training on your inputs
        </span>
        <Link
          to="/trust"
          className="ml-2 font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
        >
          Trust Center →
        </Link>
      </div>
    </div>
  </div>
);

export default TrustRibbon;
