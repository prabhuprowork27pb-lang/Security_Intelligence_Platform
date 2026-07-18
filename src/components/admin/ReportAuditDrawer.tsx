import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

interface Row { id: string; action: string; created_at: string; actor_label: string | null; report_version: number | null; metadata: any; }

interface Props {
  assessmentId: string | null;
  siteName?: string | null;
  onClose: () => void;
}

export const ReportAuditDrawer = ({ assessmentId, siteName, onClose }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("report_audit_log" as any)
        .select("id, action, created_at, actor_label, report_version, metadata")
        .eq("assessment_id", assessmentId)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, [assessmentId]);

  return (
    <Sheet open={!!assessmentId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Audit trail</SheetTitle>
          <SheetDescription>{siteName ?? "Report activity"}</SheetDescription>
        </SheetHeader>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-6">No activity recorded yet.</p>
        ) : (
          <ol className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="border-b border-border/40 last:border-0 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm capitalize">{r.action.replace(/_/g, " ")}</span>
                  {r.report_version ? <Badge variant="outline" className="text-[10px]">v{r.report_version}</Badge> : null}
                  {r.actor_label ? <Badge variant="secondary" className="text-[10px]">{r.actor_label}</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(r.created_at).toLocaleString()}
                </p>
                {r.metadata && Object.keys(r.metadata).length > 0 && (
                  <pre className="mt-1 text-[10px] text-muted-foreground bg-muted/40 rounded p-2 overflow-x-auto">
                    {JSON.stringify(r.metadata, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ReportAuditDrawer;
