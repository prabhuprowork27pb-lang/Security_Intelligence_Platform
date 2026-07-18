import { useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const PulseRefreshButton = () => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-trigger-pulse-ingest");
    setBusy(false);
    if (error) {
      toast({ title: "Pulse refresh failed", description: error.message, variant: "destructive" });
      return;
    }
    const d = data as any;
    toast({
      title: "Pulse refresh complete",
      description: `Sources: ${d?.sources_fetched ?? 0} · Added: ${d?.items_added ?? 0} · Tagged: ${d?.items_tagged ?? 0}${
        d?.errors?.length ? ` · Errors: ${d.errors.length}` : ""
      }`,
    });
  };

  return (
    <Button onClick={run} disabled={busy} size="sm" variant="outline">
      {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Radio className="mr-2 h-3.5 w-3.5" />}
      Re-run Pulse ingest
    </Button>
  );
};

export default PulseRefreshButton;
