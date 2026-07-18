import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { BRAND } from "@/lib/brand";

const SCHEMA = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  organisation: z.string().trim().min(2, "Organisation is required").max(160),
  email: z.string().trim().email("Valid email required").max(255),
  whatsapp: z.string().trim().regex(/^\+?[0-9 -]{10,16}$/, "Enter a valid mobile number"),
  industry: z.string().min(1, "Select an industry"),
  siteCount: z.string().min(1, "Select site count"),
  requirement: z.string().trim().min(500, "Please provide at least 500 characters — Studio engagements need real context to scope properly").max(4000),
});

import { INDUSTRIES as MASTER_INDUSTRIES, isOther, OTHER_MAX_LEN } from "@/lib/masterData";
// Studio enquiry inherits the same canonical industries used across the platform.
const INDUSTRIES = MASTER_INDUSTRIES;

const SITE_COUNTS = ["Single site", "2 – 5 sites", "6 – 20 sites", "20+ sites / national footprint"];

interface StudioInquiryDialogProps {
  trigger: ReactNode;
  defaultRequirement?: string;
}

export const StudioInquiryDialog = ({ trigger, defaultRequirement }: StudioInquiryDialogProps) => {
  const { toast } = useToast();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    organisation: "",
    email: "",
    whatsapp: "",
    industry: "",
    industryOther: "",
    siteCount: "",
    requirement: defaultRequirement ?? "",
  });

  // Pre-fill identity fields from the verified profile so signed-in users
  // never re-key information we already hold.
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      name: f.name || profile.full_name || "",
      email: f.email || profile.email || "",
      organisation: f.organisation || profile.company || "",
      whatsapp: f.whatsapp || profile.mobile || "",
    }));
  }, [profile]);

  const lockName = Boolean(profile?.full_name && !!profile?.verified_at);
  const lockEmail = Boolean(profile?.email && !!profile?.verified_at);
  const lockOrg = Boolean(profile?.company);
  const lockPhone = Boolean(profile?.mobile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = SCHEMA.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Please review the form", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Daily cap: one Security Studio™ enquiry per verified email per day.
      // Prevents accidental duplicate submissions and keeps advisory intake clean.
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("dslr_leads" as any)
        .select("id", { count: "exact", head: true })
        .ilike("email", form.email)
        .eq("status", "studio_inquiry")
        .gte("created_at", since);
      if ((count ?? 0) > 0) {
        toast({
          title: "Request already received",
          description: "We've received an enquiry from this email in the last 24 hours. Our advisory team will be in touch shortly.",
        });
        setDone(true);
        setSubmitting(false);
        return;
      }

      const industryLabel = isOther(form.industry) && form.industryOther.trim()
        ? `Other (${form.industryOther.trim()})`
        : form.industry;
      await supabase.from("dslr_leads" as any).insert({
        name: form.name,
        role: "Studio Inquiry",
        email: form.email,
        phone: form.whatsapp,
        message: `Industry: ${industryLabel} · Sites: ${form.siteCount} · Org: ${form.organisation}\n\n${form.requirement}`,
        status: "studio_inquiry",
      } as any);
      toast({
        title: "Thank you",
        description: "Your advisory request has been received successfully. Our team will review your requirement and contact you shortly.",
      });
      setDone(true);
    } catch (err: any) {
      toast({
        title: "We couldn't submit your request",
        description: "Please try again in a moment. If the issue persists, our team has been notified.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDone(false); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        {done ? (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-2">Inquiry received</h2>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Thank you. Your request has been received and the {BRAND.premium} advisory team will contact you <strong className="text-foreground">within 2 business days</strong>.
            </p>
            <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{BRAND.trustTrio}</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Request {BRAND.premium}</DialogTitle>
              <DialogDescription>
                A premium, expert-led engagement. Share a few details and our advisory team will respond within 2 business days.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Field id="name" label="Full name *" autoComplete="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} disabled={lockName} />
              <Field id="organisation" label="Company *" autoComplete="organization" value={form.organisation} onChange={(v) => setForm({ ...form, organisation: v })} disabled={lockOrg} />
              <Field id="email" label="Email *" type="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} disabled={lockEmail} />
              <Field id="whatsapp" label="Mobile *" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} disabled={lockPhone} />
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v, industryOther: isOther(v) ? form.industryOther : "" })}>
                  <SelectTrigger id="industry" className="min-h-[44px]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {isOther(form.industry) && (
                  <Input
                    id="industryOther"
                    aria-label="Please specify your industry"
                    placeholder="Please specify your industry"
                    maxLength={OTHER_MAX_LEN}
                    value={form.industryOther}
                    className="min-h-[44px] mt-2"
                    onChange={(e) => setForm({ ...form, industryOther: e.target.value })}
                    required
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="siteCount">Site count</Label>
                <Select value={form.siteCount} onValueChange={(v) => setForm({ ...form, siteCount: v })}>
                  <SelectTrigger id="siteCount" className="min-h-[44px]"><SelectValue placeholder="Select site count" /></SelectTrigger>
                  <SelectContent>{SITE_COUNTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="requirement">Requirement summary</Label>
                  <span className={`text-xs tabular-nums ${form.requirement.trim().length < 500 ? "text-muted-foreground" : "text-secondary font-medium"}`}>
                    {form.requirement.trim().length} / 500 min
                  </span>
                </div>
                <Textarea
                  id="requirement"
                  rows={8}
                  placeholder="Describe your environment, scope, current pain-points, what Studio™ should validate or refine, decision timeline, and any prior assessments. The more context, the sharper the response (minimum 500 characters)."
                  value={form.requirement}
                  onChange={(e) => setForm({ ...form, requirement: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Studio™ engagements are sized from this brief. Submissions under 500 characters typically don't yield a useful proposal.
                </p>
              </div>
              <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border/50 pt-4">
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                  Confidential. No marketing list. Response within 2 business days.
                </p>
                <Button type="submit" size="lg" disabled={submitting} className="min-h-[48px]">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Inquiry
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Field = ({
  id, label, value, onChange, type = "text", placeholder, autoComplete, inputMode, disabled,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal";
  disabled?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>
      {label}
      {disabled ? <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">From your profile</span> : null}
    </Label>
    <Input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      className="min-h-[44px]"
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      readOnly={disabled}
      required
    />
  </div>
);

export default StudioInquiryDialog;
