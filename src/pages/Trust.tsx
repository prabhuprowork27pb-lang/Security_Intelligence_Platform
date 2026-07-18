import { SiteHeader } from "@/components/SiteHeader";
import { Seo } from "@/components/Seo";
import { PmiPageHero } from "@/components/PmiPageHero";
import { TrustRibbon } from "@/components/TrustRibbon";
import TraceabilityStrip from "@/components/TraceabilityStrip";
import { InlineCta } from "@/components/InlineCta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Lock, KeyRound, Server, Eye, FileLock2, Users, History,
  AlertTriangle, MapPin, CheckCircle2, Mail
} from "lucide-react";

const PILLARS = [
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Encryption everywhere",
    body: "All data is encrypted at rest with AES-256 and in transit with TLS 1.3. Backups inherit the same envelope.",
  },
  {
    icon: <Server className="h-5 w-5" />,
    title: "In-region hosting",
    body: "Your assessment payload, evidence and reports remain on infrastructure hosted within the Indian sub-continent perimeter, aligned to the Digital Personal Data Protection Act, 2023.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Row-level isolation",
    body: "Every record carries an owner. Postgres Row-Level Security policies make it physically impossible for one customer's session to read another customer's row — enforced at the database, not the application.",
  },
  {
    icon: <KeyRound className="h-5 w-5" />,
    title: "Least-privilege access",
    body: "Internal access is gated by named roles. The platform team can never see your evidence narrative or scoring commentary unless you explicitly invite a reviewer.",
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "No silent training",
    body: "Your inputs are never used to train any third-party model, sold, or shared. AI inference runs through audited gateways with prompt-level redaction of identifiers.",
  },
  {
    icon: <FileLock2 className="h-5 w-5" />,
    title: "Watermarked exports",
    body: "Every PDF report and on-screen view is watermarked with the requesting user's identity, timestamp and asset reference — providing forensic traceability if a document ever leaves your perimeter.",
  },
  {
    icon: <History className="h-5 w-5" />,
    title: "Audit trail by default",
    body: "Initiation, submission, validation and report-ready timestamps are stamped on every diagnostic. Admin-side actions are logged and retained.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Role-aware surfaces",
    body: "Client and administrator views are physically separated. A client account cannot see another client; an administrator cannot escalate without an audit footprint.",
  },
];

const COMMITMENTS = [
  "We will never sell, rent, syndicate or commercialise your data.",
  "We will never use your assessment content to train external AI models.",
  "We will never expose another customer's data to your account, by design.",
  "We will notify you within 72 hours of any confirmed material incident.",
  "You may request export and deletion of your data at any time.",
];

const Trust = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Trust & Privacy — Security, confidentiality and operational integrity"
        description="The trust architecture behind the Security Intelligence Platform: confidential workflows, secure payment infrastructure, protected operational diagnostics, privacy-conscious design and controlled report access."
        path="/trust"
      />
      <SiteHeader />

      {/* Hero */}
      <PmiPageHero
        eyebrow="Trust & Privacy"
        headlineSolid="Quiet confidence."
        headlineGradient="Engineered for integrity."
        lede="Confidential workflows. Secure payment infrastructure. Protected operational diagnostics. Privacy-conscious platform design. Controlled report access. Each layer is engineered before the first question is answered — not retrofitted afterwards."
      />


      {/* Pillars */}
      <section className="container mx-auto px-6 py-14 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-3xl mb-2">How we protect what you share</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Eight engineered safeguards — applied uniformly to every byte you upload, every score
            we compute, and every report we deliver.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <Card key={p.title} className="border-border/60 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {p.icon}
                  </div>
                  <CardTitle className="text-base font-heading leading-snug pt-1">
                    {p.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
                {p.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Commitments */}
      <section className="bg-muted/40 border-y border-border/60">
        <div className="container mx-auto px-6 py-14 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-3">Our Standing Commitments</Badge>
            <h2 className="font-heading font-bold text-3xl">Five promises, in writing.</h2>
          </div>
          <div className="space-y-3">
            {COMMITMENTS.map((c) => (
              <div key={c} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm md:text-base leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TraceabilityStrip />

      {/* Compliance posture */}
      <section id="standards" className="container mx-auto px-6 py-14 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                <CardTitle className="text-lg">Regulatory alignment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">DPDP Act, 2023</strong> — purpose-bound processing, consent withdrawal, data principal rights honoured.</p>
              <p><strong className="text-foreground">IT Act, 2000 & SPDI Rules, 2011</strong> — reasonable security practices aligned to Section 43A.</p>
              <p><strong className="text-foreground">CERT-In Directions, 2022</strong> — log retention and incident reporting timelines observed.</p>
              <p><strong className="text-foreground">ISO/IEC 27001:2022</strong> — information security controls framework referenced in platform design.</p>
              <p><strong className="text-foreground">ISO/IEC 18788</strong> — framework reference for private security operations management.</p>
              <p><strong className="text-foreground">ISO 22301</strong> — business continuity discipline embedded into the diagnostic logic.</p>
              <p><strong className="text-foreground">PSARA, 2005</strong> — alignment surfaced in domain commentary where applicable.</p>
              <p><strong className="text-foreground">RBI / IRDAI / SEBI guidance</strong> — sectoral cyber-resilience expectations contextualised in BFSI reports.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-lg">Incident posture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Continuous logging of authentication, role escalation and report generation events.</p>
              <p>Quarterly internal review of access patterns and anomalies.</p>
              <p>Coordinated disclosure window for responsibly reported vulnerabilities.</p>
              <p>Customer notification within <strong className="text-foreground">72 hours</strong> of any confirmed material incident.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-6 pb-16 max-w-4xl">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-8 text-center">
            <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-heading font-bold text-2xl mb-2">A question for our security team?</h3>
            <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
              We respond personally to every privacy, security or compliance enquiry. No ticketing
              maze, no canned replies.
            </p>
            <a
              href="mailto:trust@securityintelplatform.com"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              trust@securityintelplatform.com
            </a>
          </CardContent>
        </Card>
      </section>

      <section className="container mx-auto px-6 pb-12 max-w-5xl">
        <InlineCta
          eyebrow="Trust earned in design — not promised in copy"
          title="Begin your diagnostic on the same infrastructure described above."
          body="Every safeguard on this page is enforced before the first question is answered. Run your Intelligence Diagnostic with full confidence in data residency, isolation and watermarked exports."
        />
      </section>

      <TrustRibbon />
    </div>
  );
};

export default Trust;
