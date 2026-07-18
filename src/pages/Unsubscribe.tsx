import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";

type State = "loading" | "valid" | "invalid" | "already" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: ANON } }
        );
        const j = await r.json();
        if (!r.ok) {
          setState("invalid");
          return;
        }
        if (j?.valid === true) setState("valid");
        else if (j?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setBusy(false);
    if (error) {
      setState("error");
      return;
    }
    if ((data as any)?.success) setState("success");
    else if ((data as any)?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-6">
      <Seo title="Email preferences — SIP™" description="Manage email subscription preferences for the Security Intelligence Platform." path="/unsubscribe" noindex />
      <Card className="max-w-md w-full p-8 text-center">
        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-heading text-xl font-semibold mb-2">
          Email preferences
        </h1>
        {state === "loading" && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Confirm that you want to unsubscribe from Security Intelligence
              Platform™ emails. You will still receive critical account messages.
            </p>
            <Button onClick={confirm} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm unsubscribe"}
            </Button>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="h-8 w-8 text-accent mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              You have been unsubscribed. Sorry to see you go.
            </p>
          </>
        )}
        {state === "already" && (
          <p className="text-sm text-muted-foreground">
            This email is already unsubscribed.
          </p>
        )}
        {(state === "invalid" || state === "error") && (
          <>
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {state === "invalid"
                ? "This unsubscribe link is invalid or has expired."
                : "Something went wrong. Please try again later."}
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default Unsubscribe;
