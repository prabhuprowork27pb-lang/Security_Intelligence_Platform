import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { Seo } from "@/components/Seo";
import { PmiPageHero } from "@/components/PmiPageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageCircle, ShieldCheck, Send } from "lucide-react";
import { BRAND } from "@/lib/brand";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Please enter a valid email").max(320),
  role: z.string().trim().min(1, "Role is required").max(200),
  organisation: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10, "Please share a few words").max(5000),
});

const SUPPORT_EMAIL = "support@securityintelplatform.com";

const Contact = () => {
  const [params] = useSearchParams();
  const topic = params.get("topic");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    organisation: "",
    phone: "",
    message: "",
    website: "", // honeypot
  });

  useEffect(() => {
    if (topic === "whatsapp") {
      setForm((f) => ({
        ...f,
        message:
          "I'd like an invite to the Security Intelligence Platform™ WhatsApp Community.",
      }));
    } else if (topic === "studio") {
      setForm((f) => ({
        ...f,
        message:
          "I'd like to explore a Security Studio™ engagement for our organisation.",
      }));
    }
  }, [topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.website) return; // honeypot triggered

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Please check the form";
      toast({ title: "Please review", description: first, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("dslr_leads").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      message: `[Contact form${topic ? ` · ${topic}` : ""}]${
        parsed.data.organisation ? ` Org: ${parsed.data.organisation}.` : ""
      } ${parsed.data.message}`,
    });
    setLoading(false);

    if (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
    toast({
      title: "Thank you",
      description: "We will revert within one working day.",
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Contact — Security Intelligence Platform"
        description="Speak to the Security Intelligence Platform™ team. We respond personally to every enquiry — no ticketing maze, no canned replies."
        path="/contact"
      />
      <SiteHeader />

      <PmiPageHero
        eyebrow="Contact"
        headlineSolid="A direct line"
        headlineGradient="to the practice."
        lede={<>Questions about a diagnostic, a Studio™ engagement, the Intelligent Community, or how {BRAND.shortTm} handles your data — write to us. A named practitioner replies, usually within one working day.</>}
      />

      <section className="container mx-auto px-5 md:px-6 py-14 md:py-20 max-w-5xl">
        <div className="max-w-2xl">
        </div>


        <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6 md:gap-8 mt-10">
          {/* Form */}
          <Card className="border-border/60">
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                    <Send className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-2xl font-semibold mb-2">
                    Message received.
                  </h2>
                  <p className="text-muted-foreground">
                    Thank you. We will revert to{" "}
                    <span className="text-foreground">{form.email}</span> within one
                    working day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="c-name">Name *</Label>
                      <Input
                        id="c-name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="c-role">Role *</Label>
                      <Input
                        id="c-role"
                        required
                        placeholder="CSO, COO, Head of Security…"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="c-email">Email *</Label>
                      <Input
                        id="c-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="c-phone">Mobile (optional)</Label>
                      <Input
                        id="c-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="c-org">Organisation</Label>
                    <Input
                      id="c-org"
                      value={form.organisation}
                      onChange={(e) =>
                        setForm({ ...form, organisation: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="c-msg">How can we help? *</Label>
                    <Textarea
                      id="c-msg"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  {/* Honeypot */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full sm:w-auto min-h-[48px]"
                  >
                    {loading ? "Sending…" : "Send message"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-[11px] text-muted-foreground/80">
                    We use your details only to respond. Stored under our Trust &
                    Privacy posture; never sold or used for marketing.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2 text-secondary">
                  <Mail className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.25em] font-semibold">
                    Write to us
                  </p>
                </div>
                <p className="font-heading text-base font-semibold text-foreground">
                  trust@securityintelplatform.com
                </p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Every form submission is routed to a named practitioner within one business day. For privacy, compliance or data-subject requests, write directly to the address above — we acknowledge within 24 hours.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2 text-secondary">
                  <MessageCircle className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.25em] font-semibold">
                    Community
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Looking for the Intelligent Community? Request an invite from this
                  form (mention WhatsApp), or visit the{" "}
                  <a href="/community" className="text-foreground hover:text-secondary">
                    Community page
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2 text-secondary">
                  <ShieldCheck className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.25em] font-semibold">
                    Response standard
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Replies are personal, from a named practitioner — typically within
                  one working day. Urgent operational queries are prioritised.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
