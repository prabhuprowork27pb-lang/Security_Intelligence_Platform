import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "sample_access_v1";
const COOLDOWN_KEY = "sample_access_cooldown_v1";
const COOLDOWN_MS = 30_000;

export interface SampleAccess {
  name: string;
  whatsapp: string;
  verifiedAt: string;
}

export const getSampleAccess = (): SampleAccess | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SampleAccess;
  } catch {
    return null;
  }
};

interface SampleOtpGateProps {
  onVerified: (access: SampleAccess) => void;
}

/**
 * Lead-capture gate for public sample reports. We do NOT issue or verify
 * any OTP in the browser — that would expose codes to anyone with devtools.
 * Access is granted once the lead is captured server-side.
 */
export const SampleOtpGate = ({ onVerified }: SampleOtpGateProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    const existing = getSampleAccess();
    if (existing) onVerified(existing);
  }, [onVerified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!name.trim() || !/^\+?[0-9 -]{10,16}$/.test(whatsapp.trim())) {
      toast({
        title: "Check your details",
        description: "Name and a valid WhatsApp number are required.",
        variant: "destructive",
      });
      return;
    }

    // Lightweight client-side cool-down to stop submit-spam loops.
    const last = Number(sessionStorage.getItem(COOLDOWN_KEY) ?? 0);
    const wait = COOLDOWN_MS - (Date.now() - last);
    if (wait > 0) {
      toast({
        title: "Please wait a moment",
        description: `Try again in ${Math.ceil(wait / 1000)}s.`,
        variant: "destructive",
      });
      return;
    }

    submittingRef.current = true;
    setBusy(true);
    try {
      await supabase.from("dslr_leads" as any).insert({
        name: name.trim(),
        role: "Sample report request",
        email: `sample+${Date.now()}@anonymous.local`,
        phone: whatsapp.trim(),
        message: "Requested sample-report access",
        status: "sample_access_requested",
      } as any);
      sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      const access: SampleAccess = {
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        verifiedAt: new Date().toISOString(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(access));
      toast({
        title: "Access unlocked",
        description: "Sample reports are now available. Our team will reach out on WhatsApp.",
      });
      onVerified(access);
    } catch (err: any) {
      toast({
        title: "Could not unlock access",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      submittingRef.current = false;
    }
  };

  return (
    <Card className="max-w-md mx-auto border-secondary/25">
      <CardContent className="p-7">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/15 text-secondary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold">Verify access</p>
            <h3 className="font-heading font-semibold text-base leading-tight">Free — no payment required</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sample Intelligence Reports are watermarked exemplars. Share your details and we'll unlock access instantly.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp number</Label>
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98xxxxxxxx"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              maxLength={16}
            />
          </div>
          <Button type="submit" className="w-full min-h-[48px] text-base" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Unlock sample reports
          </Button>
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed text-center">
            Your number stays confidential. We use it only to verify access and follow up.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default SampleOtpGate;
