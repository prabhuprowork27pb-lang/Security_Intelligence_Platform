import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InlineCta } from "@/components/InlineCta";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  FileText,
  Building2,
  Layers,
  Compass,
  Sparkles,
} from "lucide-react";

const Help = () => {
  const navigate = useNavigate();

  const domains: { name: string; description: string }[] = [
    {
      name: "Governance & Policy",
      description:
        "Defines the structural foundation of security through policies, roles, and accountability.",
    },
    {
      name: "Perimeter & Access Control",
      description:
        "Establishes how the boundary is defined, controlled, and monitored across people and vehicles.",
    },
    {
      name: "Visitor Management",
      description:
        "Governs how external presence is identified, recorded, and supervised within the environment.",
    },
    {
      name: "Security Personnel & Operations",
      description:
        "Covers the deployment, supervision, and operational discipline of on-ground security teams.",
    },
    {
      name: "Electronic Security Systems",
      description:
        "Evaluates the integration, coverage, and reliability of surveillance, access, and detection systems.",
    },
    {
      name: "Incident Management",
      description:
        "Examines preparedness, response, escalation, and post-event learning across security incidents.",
    },
    {
      name: "Security Culture & Awareness",
      description:
        "Reflects how consistently security expectations are understood and practised across the workforce.",
    },
    {
      name: "Business Continuity & Crisis Management",
      description:
        "Assesses preparedness for disruption, evacuation, and continuity of critical operations.",
    },
    {
      name: "Compliance & Audit",
      description:
        "Considers regulatory alignment, internal review discipline, and third-party validation practices.",
    },
    {
      name: "Site Context & Risk Factors",
      description:
        "Captures the influence of location, neighbourhood, and built environment on overall exposure.",
    },
  ];

  const scoreScale: { level: string; label: string }[] = [
    { level: "1", label: "Ad-hoc — Informal, reactive" },
    { level: "2", label: "Developing — Inconsistent practice" },
    { level: "3", label: "Defined — Documented and standardised" },
    { level: "4", label: "Managed — Measured, with named owners" },
    { level: "5", label: "Resilient — Continuously improved" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Help & Guide — Security Selfie"
        description="Understand the Security Selfie methodology: ten domains, scoring bands, evidence model and how to interpret your posture report."
        path="/help"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is Security Selfie?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Security Selfie is an enterprise security intelligence platform that turns scattered physical security operations into a measurable, defensible system across ten operating domains.",
              },
            },
            {
              "@type": "Question",
              name: "How does the diagnostic work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Define your scope, run a guided evidence-led assessment across ten domains, and receive a 0–100 posture score, domain breakdown, risk heatmap and a prioritised 30/60/90-day action plan.",
              },
            },
          ],
        }}
      />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-foreground/10 ring-1 ring-primary-foreground/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-base md:text-lg font-heading font-semibold tracking-tight">
                Security Intelligence Platform
              </p>
              <p className="text-[11px] md:text-xs text-primary-foreground/70">Security Selfie™</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Command Center
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-wider text-secondary mb-3 font-medium">
            Intelligence Guide
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight mb-3">
            Security Selfie™ — Intelligence Guide
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            Understanding your security posture through structured diagnostics.
          </p>
        </div>

        <div className="space-y-6">
          {/* What is Security Selfie */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                What is Security Selfie™
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground/90">
              <p>
                Security Selfie™ is a structured diagnostic designed to provide a clear,
                intelligence-driven snapshot of your security environment.
              </p>
              <p className="text-muted-foreground">
                It evaluates your security posture across critical domains and presents insights
                that support both operational and leadership-level decision-making.
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <Compass className="h-5 w-5 text-secondary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-foreground/90">
                {[
                  "Define your organisation and site.",
                  "Complete structured diagnostic inputs.",
                  "Submit your assessment.",
                  "Receive a reviewed intelligence report within 2 business days.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-3">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-secondary/10 text-secondary text-xs font-mono font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Understanding Your Scores */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <BarChart3 className="h-5 w-5 text-secondary" />
                Understanding Your Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/90">
                Scores represent the level of implementation and operational consistency across
                each domain.
              </p>
              <div className="rounded-lg border border-border/60 divide-y divide-border/60">
                {scoreScale.map((s) => (
                  <div key={s.level} className="flex items-center gap-4 px-4 py-3">
                    <span className="font-mono font-semibold text-secondary w-6 text-center">
                      {s.level}
                    </span>
                    <span className="text-sm text-foreground/90">{s.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Domains */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <Layers className="h-5 w-5 text-secondary" />
                Security Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {domains.map((d) => (
                  <div key={d.name} className="rounded-lg border border-border/50 p-4">
                    <h4 className="font-heading font-semibold text-sm mb-1">{d.name}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Output */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <FileText className="h-5 w-5 text-secondary" />
                Report Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90">
                The platform delivers a structured intelligence report designed for stakeholder
                communication, operational clarity, and decision-making.
              </p>
            </CardContent>
          </Card>

          {/* SMARTY */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <MessageSquare className="h-5 w-5 text-secondary" />
                SMARTY — Your Security Advisor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/90">
                SMARTY is your embedded security advisor within the platform. It helps you:
              </p>
              <ul className="space-y-2 text-foreground/90 list-disc list-inside marker:text-secondary">
                <li>Interpret diagnostic results.</li>
                <li>Prioritise actions.</li>
                <li>Understand risk implications.</li>
                <li>Prepare leadership-level narratives.</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                SMARTY is available for premium users.
              </p>
            </CardContent>
          </Card>

          {/* Security Studio */}
          <Card className="border border-border/60 shadow-sm bg-gradient-to-br from-secondary/[0.04] to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <Sparkles className="h-5 w-5 text-secondary" />
                Security Studio™
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground/90">
                Security Studio™ is a specialised, expert-led engagement designed for environments
                requiring deeper analysis, validation, and strategic alignment.
              </p>
              <p className="text-muted-foreground">
                It builds on Security Selfie™ insights and enables a more contextual and
                comprehensive evaluation of your security setup.
              </p>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <Building2 className="h-5 w-5 text-secondary" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-foreground/90 list-disc list-inside marker:text-secondary">
                <li>Maintain accuracy in inputs to ensure meaningful insights.</li>
                <li>Conduct periodic diagnostics to track maturity evolution.</li>
                <li>Use outputs to support structured decision-making.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-10" />

        <div className="mb-10">
          <InlineCta
            variant="compact"
            eyebrow="Ready to act on what you've learned?"
            title="Begin or resume an Intelligence Diagnostic from your Command Center."
            primaryLabel="Open Command Center"
            hideSecondary
          />
        </div>

        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Reviewed. Structured. Operationally grounded.
          </p>
          <Button onClick={() => navigate("/dashboard")} size="lg">
            Return to Command Center
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Help;
