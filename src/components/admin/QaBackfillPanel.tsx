import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCw, Search, ExternalLink, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  id: string;
  created_at: string | null;
  submitted_at: string | null;
  report_status: string | null;
  review_status: string | null;
  overall_score_0_100: number | null;
  sites: { name: string | null; organisations: { name: string | null } | null } | null;
}

type RunState = "idle" | "running" | "success" | "error";
interface RowResult {
  state: RunState;
  previousScore?: number | null;
  newScore?: number | null;
  pdfPath?: string | null;
  error?: string;
}

export const QaBackfillPanel = ({ onCompleteRefresh }: { onCompleteRefresh?: () => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, RowResult>>({});
  const [batchRunning, setBatchRunning] = useState(false);

  const findCandidates = async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    // (a) report_status='none' AND overall_score > 0 AND submitted/completed
    // (b) review_status='report_ready'
    const { data, error } = await supabase
      .from("assessments")
      .select(
        "id, created_at, submitted_at, report_status, review_status, overall_score_0_100, sites(name, organisations(name))" as any
      )
      .or(
        `and(report_status.eq.none,overall_score_0_100.gt.0),review_status.eq.report_ready`
      )
      .lt("submitted_at", cutoff)
      .order("submitted_at", { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      // fall back: some rows may have submitted_at NULL — also try created_at filter
      toast({ title: "Search failed", description: error.message, variant: "destructive" });
      return;
    }
    const list = (data ?? []) as unknown as Candidate[];
    setCandidates(list);
    setSelected(new Set(list.map((c) => c.id)));
    setResults({});
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!candidates) return;
    if (selected.size === candidates.length) setSelected(new Set());
    else setSelected(new Set(candidates.map((c) => c.id)));
  };

  const runOne = async (id: string) => {
    setResults((r) => ({ ...r, [id]: { state: "running" } }));
    const { data, error } = await supabase.functions.invoke("admin-regenerate-report", {
      body: { assessment_id: id },
    });
    if (error || (data as any)?.error) {
      setResults((r) => ({
        ...r,
        [id]: { state: "error", error: (data as any)?.error ?? error?.message ?? "Failed" },
      }));
      return false;
    }
    setResults((r) => ({
      ...r,
      [id]: {
        state: "success",
        previousScore: (data as any).previous_score,
        newScore: (data as any).new_score,
        pdfPath: (data as any).report_pdf_path,
      },
    }));
    return true;
  };

  const runBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Regenerate ${ids.length} report(s)? This will overwrite the existing PDF and set status to pending_review. Email pipeline is NOT triggered.`)) return;
    setBatchRunning(true);
    for (const id of ids) {
      await runOne(id);
      // small breather to be kind to the AI quota
      await new Promise((res) => setTimeout(res, 600));
    }
    setBatchRunning(false);
    toast({ title: "Backfill finished", description: `Processed ${ids.length} assessment(s).` });
    onCompleteRefresh?.();
  };

  const previewPdf = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("admin-get-report-signed-url", {
      body: { assessment_id: id, download: false },
    });
    if (error || (data as any)?.error) {
      toast({ title: "Preview failed", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    window.open((data as any).signedUrl, "_blank", "noopener");
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <CardTitle className="flex items-center gap-2 text-base">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Wrench className="h-4 w-4 text-muted-foreground" />
          QA Backfill — regenerate reports older than 48 hrs
        </CardTitle>
        <p className="text-xs text-muted-foreground pl-6 mt-1">
          Re-runs scoring + insights + PDF render with the current prompt, overwrites the existing PDF, sets status to <em>pending_review</em>. Email pipeline is never invoked.
        </p>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={findCandidates} disabled={loading || batchRunning}>
              {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Search className="h-3 w-3 mr-2" />}
              Find candidates
            </Button>
            {candidates && candidates.length > 0 && (
              <>
                <Button
                  size="sm"
                  onClick={() => runBatch(Array.from(selected))}
                  disabled={batchRunning || selected.size === 0}
                >
                  {batchRunning ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                  Regenerate selected ({selected.size})
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => runBatch(candidates.map((c) => c.id))}
                  disabled={batchRunning}
                >
                  Regenerate all ({candidates.length})
                </Button>
              </>
            )}
          </div>

          {candidates && candidates.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No eligible assessments found.</p>
          )}

          {candidates && candidates.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selected.size === candidates.length}
                        onCheckedChange={toggleAll}
                        disabled={batchRunning}
                      />
                    </TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Current status</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c) => {
                    const r = results[c.id];
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(c.id)}
                            onCheckedChange={() => toggle(c.id)}
                            disabled={batchRunning || r?.state === "running"}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{c.sites?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{c.sites?.organisations?.name ?? ""}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {c.review_status === "report_ready" ? "report_ready" : (c.report_status ?? "none")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{c.overall_score_0_100?.toFixed(0) ?? "—"}</TableCell>
                        <TableCell>
                          {!r && <span className="text-xs text-muted-foreground">—</span>}
                          {r?.state === "running" && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" /> Running…
                            </span>
                          )}
                          {r?.state === "success" && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {Math.round(Number(r.previousScore ?? 0))} → <strong>{Math.round(Number(r.newScore ?? 0))}</strong>
                            </span>
                          )}
                          {r?.state === "error" && (
                            <span className="inline-flex items-start gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3 mt-0.5" />
                              <span className="line-clamp-2">{r.error}</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => runOne(c.id)}
                              disabled={batchRunning || r?.state === "running"}
                              title="Regenerate this one"
                            >
                              {r?.state === "running" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            </Button>
                            {r?.state === "success" && (
                              <Button size="sm" variant="outline" onClick={() => previewPdf(c.id)} title="Preview new PDF">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default QaBackfillPanel;
