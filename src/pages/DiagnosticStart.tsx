import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, ArrowRight, Lock, KeyRound } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { validateMobile, mobileSchema } from "@/lib/mobileValidation";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BRAND } from "@/lib/brand";
import ConfidentialityNote from "@/components/ConfidentialityNote";
import { z } from "zod";

const FULL_SCHEMA = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  organisation: z.string().trim().max(160).optional().or(z.literal("")),
  designation: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email("Valid email required").max(255),
  whatsapp: mobileSchema,
  industry: z.string().optional().or(z.literal("")),
  siteType: z.string().optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
});

const SITE_SCHEMA = z.object({
  industry: z.string().optional().or(z.literal("")),
  siteType: z.string().optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
});

import { INDUSTRIES, SITE_TYPES, isOtherValue } from "@/lib/siteTypes";
const isOther = isOtherValue;
const OTHER_MAX_LEN = 80;
import { BUILD_ID, OTP_LENGTH_EXPECTED } from "@/lib/buildInfo";

const RESEND_COOLDOWN = 45;
// Source of truth for OTP length is the build-time constant in vite.config.ts.
const OTP_LENGTH = OTP_LENGTH_EXPECTED;

const STASH_KEY = "sip.pendingDiagnostic";
const OTP_BUILD_KEY = "sip.otpUiBuild";
const WELCOME_PENDING_KEY = "sip.pendingWelcome";

const DiagnosticStart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Self-healing cache guard: when the OTP screen mounts under a build that
  // doesn't match the last one we saw, force one hard reload so the freshly
  // hashed bundles take over. sessionStorage prevents a reload loop.
  useEffect(() => {
    if (!sentTo) return;
    try {
      const seen = sessionStorage.getItem(OTP_BUILD_KEY);
      if (seen && seen !== BUILD_ID) {
        sessionStorage.setItem(OTP_BUILD_KEY, BUILD_ID);
        window.location.reload();
        return;
      }
      sessionStorage.setItem(OTP_BUILD_KEY, BUILD_ID);
    } catch {
      /* sessionStorage unavailable — non-fatal */
    }
  }, [sentTo]);
  const [form, setForm] = useState({
    fullName: "",
    organisation: "",
    designation: "",
    email: "",
    whatsapp: "",
    industry: "",
    industryOther: "",
    siteType: "",
    siteTypeOther: "",
    city: "",
  });

  // Pre-fill identity from verified profile so signed-in users never re-enter it.
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      fullName: profile.full_name || f.fullName,
      email: profile.email || f.email,
      organisation: profile.company || f.organisation,
      designation: profile.designation || f.designation,
      whatsapp: profile.mobile || f.whatsapp,
    }));
  }, [profile]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Post-OTP auto-hydration: once signed in, if a stashed payload exists,
  // persist the lead (verified write) and launch the assessment automatically.
  useEffect(() => {
    if (!user) return;
    let stashed: any = null;
    try {
      const local = localStorage.getItem(STASH_KEY);
      if (local) stashed = JSON.parse(local);
    } catch {}
    if (!stashed) return;

    try {
      if (sessionStorage.getItem(WELCOME_PENDING_KEY) === "1") {
        navigate("/welcome", { replace: true });
        return;
      }
    } catch {
      /* sessionStorage unavailable — continue */
    }

    (async () => {
      try {
        // Verified-only write: persist CRM lead + profile stash now that the
        // user has verified their email.
        try {
          await supabase.functions.invoke("capture-lead", {
            body: {
              full_name: stashed.fullName,
              email: (stashed.email || user.email || "").toLowerCase(),
              mobile: stashed.whatsapp,
              company: stashed.organisation,
              designation: stashed.designation,
            redirect_path: "/diagnostic/start",
            },
          });
        } catch (e) {
          console.warn("capture-lead (post-verify) failed:", e);
        }

        const orgName = (stashed.organisation || profile?.company || "My Organisation").trim();
        const cityName = (stashed.city || "Not specified").trim();
        const { data: org, error: orgErr } = await supabase
          .from("organisations")
          .insert({
            name: orgName,
            city: cityName,
            industry: stashed.industry || null,
            user_id: user.id,
          } as any)
          .select("id").single();
        if (orgErr) throw orgErr;
        const { data: site, error: siteErr } = await supabase
          .from("sites")
          .insert({
            organisation_id: org.id,
            user_id: user.id,
            name: `${orgName} — ${cityName}`,
            city: cityName,
            site_type: stashed.siteType || null,
          } as any)
          .select("id").single();
        if (siteErr) throw siteErr;
        localStorage.removeItem(STASH_KEY);
        sessionStorage.removeItem("diagnosticStart");
        navigate(`/sites/${site.id}/assessment/new`, {
          state: {
            prefill: {
              created_by_name: stashed.fullName,
              created_by_role: stashed.designation,
            },
          },
        });
      } catch (err) {
          console.error("Auto-launch after verification failed:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sendMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/welcome` },
    });
    if (error) throw error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (user) {
        // Signed-in path: identity is already verified & locked. Only
        // site-scoped fields are required.
        const parsed = SITE_SCHEMA.safeParse({
          industry: form.industry,
          siteType: form.siteType,
          city: form.city,
        });
        if (!parsed.success) {
          toast({ title: "Please review the form", description: parsed.error.errors[0].message, variant: "destructive" });
          setSubmitting(false);
          return;
        }

        // Duplicate-site guard
        const orgName = (profile?.company || form.organisation || "My Organisation").trim();
        const cityName = (form.city || "Not specified").trim();
        const normName = `${orgName} — ${cityName}`.toLowerCase();
        const { data: existing } = await supabase
          .from("sites")
          .select("id, name, city")
          .eq("user_id", user.id);
        const dupe = (existing ?? []).find(
          (s: any) => `${(s.name ?? "").trim()}`.toLowerCase() === normName
            && `${(s.city ?? "").trim()}`.toLowerCase() === cityName.toLowerCase()
        );
        if (dupe) {
          toast({
            title: "You already have this site",
            description: `A site called "${dupe.name}" already exists. Open it from your Command Centre, or differentiate the name if this is a different location.`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        // Validate "Other" free-text capture when applicable
        if (isOther(form.industry) && form.industryOther.trim().length < 2) {
          toast({ title: "Please describe your industry", description: "A short description helps us tag your account correctly.", variant: "destructive" });
          setSubmitting(false); return;
        }
        if (isOther(form.siteType) && form.siteTypeOther.trim().length < 2) {
          toast({ title: "Please describe the site type", description: "A short description helps us tag this site correctly.", variant: "destructive" });
          setSubmitting(false); return;
        }

        const { data: org, error: orgErr } = await supabase
          .from("organisations")
          .insert({ name: orgName, city: cityName, industry: form.industry || null, user_id: user.id } as any)
          .select("id").single();
        if (orgErr) throw orgErr;
        const { data: site, error: siteErr } = await supabase
          .from("sites")
          .insert({
            organisation_id: org.id,
            user_id: user.id,
            name: `${orgName} — ${cityName}`,
            city: cityName,
            site_type: form.siteType || null,
            site_type_other: isOther(form.siteType) ? form.siteTypeOther.trim() : null,
          } as any)
          .select("id").single();
        if (siteErr) throw siteErr;

        // Record industry "Other" free-text on the user's profile for admin review.
        if (isOther(form.industry)) {
          await supabase.from("profiles")
            .update({ industry_other: form.industryOther.trim() } as any)
            .eq("user_id", user.id);
        }

        const { data: guard } = await supabase.rpc("can_user_start_assessment" as any, {
          _user_id: user.id, _site_id: site.id,
        });
        if (guard && (guard as any).allowed === false) {
          const g: any = guard;
          toast({
            title: g.reason === "lifetime_cap_reached" ? "Report limit reached"
              : g.reason === "site_cooldown" ? "Recent report exists for this site"
              : "Cannot start a new assessment",
            description: g.message,
            variant: "destructive",
          });
          if (g.previous_assessment_id) {
            setTimeout(() => navigate(`/reports/${g.previous_assessment_id}/status`), 800);
          }
          setSubmitting(false);
          return;
        }

        navigate(`/sites/${site.id}/assessment/new`, {
          state: {
            prefill: {
              created_by_name: profile?.full_name || form.fullName,
              created_by_role: profile?.designation || form.designation,
            },
          },
        });
      } else {
        // Pre-auth path: validate the full form, then ONLY send the magic
        // link. No DB writes happen until the user verifies via the link.
        const parsed = FULL_SCHEMA.safeParse(form);
        if (!parsed.success) {
          toast({ title: "Please complete all required fields", description: parsed.error.errors[0].message, variant: "destructive" });
          setSubmitting(false);
          return;
        }
        // Normalise mobile to E.164 before stashing.
        const normalisedMobile = validateMobile(form.whatsapp).e164 ?? form.whatsapp;
        const stashPayload = { ...form, whatsapp: normalisedMobile };
        // Stash client-side only (no server write before verification).
        sessionStorage.setItem("diagnosticStart", JSON.stringify(stashPayload));
        sessionStorage.setItem(WELCOME_PENDING_KEY, "1");
        localStorage.setItem(STASH_KEY, JSON.stringify(stashPayload));
        await sendMagicLink(form.email.trim().toLowerCase());
        setSentTo(form.email.trim().toLowerCase());
        setCooldown(RESEND_COOLDOWN);
      }
    } catch (err: any) {
      toast({ title: "Could not continue", description: err.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!sentTo || cooldown > 0) return;
    try {
      await sendMagicLink(sentTo);
      setCooldown(RESEND_COOLDOWN);
      setOtpCode("");
      toast({ title: "Verification code resent", description: `A fresh ${OTP_LENGTH}-digit code is on its way to ${sentTo}.` });
    } catch (err: any) {
      toast({ title: "Resend failed", description: err.message ?? "Please try again shortly.", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async () => {
    if (!sentTo) return;
    if (otpCode.length !== OTP_LENGTH) {
      toast({ title: `Enter the ${OTP_LENGTH}-digit code`, description: "Please enter the complete code from your email.", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: sentTo,
        token: otpCode,
        type: "email",
      });
      if (error) throw error;
      toast({ title: "Email verified", description: "Setting up your workspace…" });
      // The `useEffect` watching `user` will auto-hydrate org+site and route
      // to the wizard, exactly as the magic-link click path does.
    } catch (err: any) {
      const raw = (err?.message || "").toLowerCase();
      console.error("[verifyOtp] failure", { code: err?.code, status: err?.status, message: err?.message });
      let title = "Verification failed";
      let description = err?.message ?? "Please try again.";
      if (raw.includes("expired") || raw.includes("token has expired")) {
        title = "Code expired";
        description = "This code is no longer valid. Tap Resend to receive a fresh one. Codes expire if a newer code has been requested for the same email.";
      } else if (raw.includes("invalid") || raw.includes("token") || raw.includes("otp")) {
        title = "Code doesn't match";
        description = "Re-check the latest email — older codes are invalidated when a new one is sent.";
      } else if (raw.includes("rate") || raw.includes("too many")) {
        title = "Too many attempts";
        description = "Please wait a minute and try again, or request a new code.";
      }
      toast({ title, description, variant: "destructive" });
      setOtpCode("");
    } finally {
      setVerifying(false);
    }
  };



  const isSignedIn = !!user;

  return (
    <>
      <Seo
        title={`Take a Security Selfie™ — ${BRAND.primary}`}
        description="Tell us about your site so we can prepare a structured Security Selfie™ intelligence diagnostic."
        path="/diagnostic/start"
      />
      <div className="min-h-dvh bg-background">
        <SiteHeader />

        <main className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-3xl">
          {sentTo ? (
            <Card className="border-border/60">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <KeyRound className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-2xl">Enter your verification code</CardTitle>
                <CardDescription className="leading-relaxed">
                  We've emailed a {OTP_LENGTH}-digit code to <span className="font-semibold text-foreground">{sentTo}</span>.<br />
                  Enter it below to verify your email and continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}
                  className="flex flex-col items-center gap-5"
                >
                  <InputOTP
                    maxLength={OTP_LENGTH}
                    value={otpCode}
                    onChange={(v) => setOtpCode(v.replace(/\D/g, ""))}
                    autoFocus
                    inputMode="numeric"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={verifying || otpCode.length !== OTP_LENGTH}
                    className="w-full sm:w-auto min-w-[220px] min-h-[48px]"
                  >
                    {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Verify & continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground leading-relaxed text-center max-w-md mx-auto">
                  Code not arrived? Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. The code expires in 10 minutes.
                </p>
                <p className="text-[10px] text-muted-foreground/60 text-center font-mono">
                  Build {BUILD_ID.slice(0, 16)} · {OTP_LENGTH}-digit
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1 border-t border-border/40">
                  <Button variant="outline" type="button" onClick={handleResend} disabled={cooldown > 0} className="mt-4">
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => { setSentTo(null); setOtpCode(""); }} className="mt-4">
                    Use a different email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-8 md:mb-10 text-center">
                <p className="text-[11px] uppercase tracking-[0.28em] text-secondary font-semibold mb-3">
                  {isSignedIn ? "New site · verified account" : "Step 1 of 2 · Verify and tell us about your site"}
                </p>
                <h1 className="font-heading text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05] mb-3 md:mb-4">
                  Begin your {BRAND.primary}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {isSignedIn
                    ? "We've already verified your identity — just confirm the site you're assessing."
                    : "We collect your details once, verify your email, then never ask again. Your information is treated as confidential."}
                </p>
              </div>

              <Card className="border-secondary/30 bg-secondary/[0.03] mb-5">
                <CardContent className="p-5 md:p-6 space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-1">
                      Before you begin
                    </p>
                    <h2 className="font-heading text-lg md:text-xl font-semibold text-foreground">
                      Security Selfie™ orientation
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      You’ll assess 10 physical-security domains using a 1–5 maturity scale: 1 Ad-hoc, 2 Developing, 3 Defined, 4 Managed, 5 Resilient.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-md border border-border/60 bg-card/60 p-3">
                      <p className="font-semibold text-foreground">Answer current reality</p>
                      <p className="text-muted-foreground mt-1">Score what is operating today, not the intended target state.</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-card/60 p-3">
                      <p className="font-semibold text-foreground">Use evidence where possible</p>
                      <p className="text-muted-foreground mt-1">Documents, logs and operating examples improve report quality.</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-card/60 p-3">
                      <p className="font-semibold text-foreground">Invite operational input</p>
                      <p className="text-muted-foreground mt-1">If unsure, ask the person closest to the control before selecting a rating.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-heading text-lg md:text-xl">
                    {isSignedIn ? "Site details" : "Your details & site"}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {isSignedIn
                      ? <>Signed in as <strong className="text-foreground">{profile?.full_name}</strong> · {profile?.email}. <button type="button" className="underline underline-offset-2 hover:text-secondary" onClick={() => navigate("/profile")}>Edit profile</button></>
                      : "Required fields are marked with *. We'll email you a verification code before creating your workspace."}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {!isSignedIn && (
                      <>
                        <Field id="fullName" label="Full name *" autoComplete="name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
                       <Field id="designation" label="Designation (optional)" autoComplete="organization-title" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
                       <Field id="organisation" label="Company (optional)" autoComplete="organization" value={form.organisation} onChange={(v) => setForm({ ...form, organisation: v })} />
                        <Field id="email" label="Email *" type="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                        <Field id="whatsapp" label="Mobile number *" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} required />
                      </>
                    )}

                    {isSignedIn && (
                      <div className="md:col-span-2 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-secondary" />
                        Your name, email, company and mobile are already on file from your verified profile.
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="industry">Industry (optional)</Label>
                      <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v, industryOther: isOther(v) ? form.industryOther : "" })}>
                        <SelectTrigger id="industry" className="min-h-[44px]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
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

                    <Field id="city" label="City (optional)" autoComplete="address-level2" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />

                    <div className="md:col-span-2 space-y-1.5">
                      <Label htmlFor="siteType">Site type (optional)</Label>
                      <Select value={form.siteType} onValueChange={(v) => setForm({ ...form, siteType: v, siteTypeOther: isOther(v) ? form.siteTypeOther : "" })}>
                        <SelectTrigger id="siteType" className="min-h-[44px]"><SelectValue placeholder="Select site type" /></SelectTrigger>
                        <SelectContent>
                          {SITE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {isOther(form.siteType) && (
                        <Input
                          id="siteTypeOther"
                          aria-label="Please specify the site type"
                          placeholder="Please specify the site type"
                          maxLength={OTHER_MAX_LEN}
                          value={form.siteTypeOther}
                          className="min-h-[44px] mt-2"
                          onChange={(e) => setForm({ ...form, siteTypeOther: e.target.value })}
                          required
                        />
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <ConfidentialityNote />
                    </div>

                    <div className="md:col-span-2 mt-2 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 border-t border-border/50 pt-5">
                      <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                        {BRAND.trustTrio}
                      </p>
                      <Button type="submit" size="lg" disabled={submitting} className="w-full md:w-auto min-h-[48px]">
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSignedIn ? "Start my Security Selfie" : "Send verification code"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </>
  );
};

const Field = ({
  id, label, value, onChange, type = "text", placeholder, autoComplete, inputMode, required = false,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string; required?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search" | "url" | "none";
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      className="min-h-[44px]"
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  </div>
);

export default DiagnosticStart;
