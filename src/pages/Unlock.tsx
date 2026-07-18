import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPricing, formatINR, type PricingConfig } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { FREE_LAUNCH_MODE } from "@/config/launchMode";

declare global {
  interface Window { Razorpay?: any; }
}

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const Unlock = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const assessmentId = params.get("assessment");
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);

  useEffect(() => {
    fetchPricing().then(setPricing);
  }, []);

  useEffect(() => {
    if (!user) navigate(`/auth?next=${encodeURIComponent(`/unlock${window.location.search}`)}`, { replace: true });
  }, [user, navigate, next]);

  // Free Launch Mode: payment is not required. Bounce the user forward and
  // surface a friendly note instead of the Razorpay flow.
  useEffect(() => {
    if (!FREE_LAUNCH_MODE) return;
    if (!user) return;
    toast({
      title: "Security Selfie™ is complimentary",
      description: "You're all set — no payment required during launch.",
    });
    navigate(next, { replace: true });
  }, [user, navigate, next, toast]);

  const handlePay = async () => {
    if (!user || !pricing) return;
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    try {
      // 1. Ask backend to create a Razorpay order
      const { data: orderData, error: orderErr } = await supabase.functions.invoke("razorpay-create-order", {
        body: {
          amount_inr: pricing.assessment_price_inr,
          assessment_id: assessmentId,
        },
      });

      if (orderErr || !orderData?.order_id) {
        const errMessage = (orderData as any)?.error || orderErr?.message || "Could not initiate payment";
        throw new Error(errMessage);
      }


      // 2. Load Razorpay checkout
      const ok = await loadRazorpay();
      if (!ok) {
        toast({
          title: "Checkout unavailable",
          description: "Payment checkout could not load. Please disable any ad blockers and try again.",
          variant: "destructive",
        });
        payingRef.current = false;
        setPaying(false);
        return;
      }

      // 3. Open the modal
      const rzp = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Security Selfie",
        description: "Intelligence Diagnostic",
        order_id: orderData.order_id,
        prefill: {
          email: user.email ?? undefined,
        },
        theme: { color: "#1877F2" },
        notes: { assessment_id: assessmentId ?? "" },
        handler: async (resp: any) => {
          // 4. Verify on the server
          const { data: vData, error: vErr } = await supabase.functions.invoke("razorpay-verify-payment", {
            body: {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              amount_inr: pricing.assessment_price_inr,
              assessment_id: assessmentId,
            },
          });
          if (vErr || !vData?.ok) {
            payingRef.current = false;
            setPaying(false);
            toast({ title: "Verification failed", description: vErr?.message ?? "Please contact support.", variant: "destructive" });
            return;
          }
          payingRef.current = false;
          toast({ title: "Payment successful", description: "Your full intelligence diagnostic is unlocked." });
          navigate(next, { replace: true });
        },
        modal: {
          ondismiss: () => {
            payingRef.current = false;
            setPaying(false);
          },
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        payingRef.current = false;
        toast({ title: "Payment failed", description: resp?.error?.description ?? "Please try again.", variant: "destructive" });
        setPaying(false);
      });
      rzp.open();
    } catch (e: any) {
      payingRef.current = false;
      toast({ title: "Payment failed", description: e.message ?? "Try again.", variant: "destructive" });
      setPaying(false);
    }
  };

  if (!pricing) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-xl border-secondary/25 shadow-2xl bg-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <Lock className="h-6 w-6" />
          </div>
          <Badge variant="secondary" className="mx-auto mb-2 w-fit">Final step · Unlock your report</Badge>
          <CardTitle className="text-3xl font-heading">Take a Security Selfie™</CardTitle>
          <CardDescription className="text-base">
            Structured intelligence diagnostic designed for operational visibility and decision support.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold mb-3">Includes</p>
            <ul className="space-y-2.5 text-sm">
              {[
                "Reviewed assessment across 10 security domains",
                "Structured intelligence report (board-ready)",
                "Operational posture insights with peer benchmarks",
                "Delivered within 2 business days",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">One-time payment</div>
            <div className="text-5xl font-heading font-semibold mt-1.5 text-foreground tabular-nums">
              {formatINR(pricing.assessment_price_inr)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">per Security Selfie™ diagnostic</div>
          </div>

          <Button onClick={handlePay} disabled={paying} size="lg" className="w-full text-base h-12">
            {paying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing payment…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Proceed Securely<ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg p-3 border border-border/50">
              <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
              <span>
                Powered securely by <strong>Razorpay</strong> — UPI, debit/credit cards, netbanking and wallets supported. Mobile-first checkout. PCI-DSS Level 1 certified.
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Secure UPI & cards",
                "Encrypted processing",
                "Trusted infrastructure",
                "Secure checkout",
              ].map((t) => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-md bg-muted/40 border border-border/50 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {assessmentId && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate(`/assessments/${assessmentId}/edit`)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                ← Review your answers
              </button>
            </div>
          )}

          <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Reviewed · Structured · Operationally grounded
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unlock;
