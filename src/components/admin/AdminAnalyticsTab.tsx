import { useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BarChart3, ClipboardList, IndianRupee, Loader2, MousePointerClick, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AnalyticsRange, useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { formatINR } from "@/lib/pricing";

const ranges: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
];

const scoreColors = ["hsl(var(--chart-5))", "hsl(var(--chart-4))", "hsl(var(--chart-3))"];

const AdminAnalyticsTab = () => {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const { data, loading, error } = useAdminAnalytics(range);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6">
          <p className="font-medium text-destructive">Analytics could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "No analytics data returned."}</p>
        </CardContent>
      </Card>
    );
  }

  const scoreDistribution = [
    { band: "Red", count: data.quality.red },
    { band: "Amber", count: data.quality.amber },
    { band: "Green", count: data.quality.green },
  ];

  const funnelRows = [
    { label: "Assessments started", value: data.operational.assessments_total },
    { label: "Submitted", value: data.operational.submitted },
    { label: "Paid", value: data.financial.paid_count },
    { label: "Report ready", value: data.operational.report_ready },
  ];

  const leadRows: [string, ReactNode][] = [
    ["New", data.leads.new],
    ["Contacted", data.leads.contacted],
    ["Qualified", data.leads.qualified],
    ["Won", data.leads.won],
    ["Lost", data.leads.lost],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary" className="mb-2">Admin analytics</Badge>
          <h2 className="text-2xl font-heading font-semibold tracking-tight">Platform Analytics</h2>
          <p className="text-sm text-muted-foreground">Operational, financial, lead, engagement, and quality signals.</p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          {ranges.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={range === item.value ? "default" : "ghost"}
              onClick={() => setRange(item.value)}
              className="h-8"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<ClipboardList className="h-5 w-5" />} label="Assessments" value={data.operational.assessments_total} detail={`${data.operational.submitted} submitted`} />
        <MetricCard icon={<IndianRupee className="h-5 w-5" />} label="Revenue" value={formatINR(data.financial.revenue_inr)} detail={`${data.financial.paid_count} paid assessments`} />
        <MetricCard icon={<Users className="h-5 w-5" />} label="Leads" value={data.leads.total} detail={`${data.leads.stale} need action`} />
        <MetricCard icon={<Activity className="h-5 w-5" />} label="Average score" value={data.quality.average_score ?? "—"} detail="0–100 roll-up" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-secondary" />
              Quality distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="band" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={entry.band} fill={scoreColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnelRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell className="text-right font-mono">{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SignalCard title="Operational" icon={<ShieldAlert className="h-5 w-5" />} rows={[
          ["Drafts started", data.operational.drafts_started],
          ["Report ready", data.operational.report_ready],
          ["Abandoned drafts", data.operational.abandoned],
          ["AI/export activity", data.operational.ai_calls],
        ]} />
        <SignalCard title="Engagement" icon={<MousePointerClick className="h-5 w-5" />} rows={[
          ["Page views", data.engagement.page_views],
          ["Unique signed-in viewers", data.engagement.unique_visitors],
          ["PDF exports", data.engagement.pdf_exports],
          ["Pinned SMARTY answers", data.engagement.smarty_pins],
        ]} />
        <SignalCard title="Leads & sales" icon={<Users className="h-5 w-5" />} rows={leadRows} />
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, detail }: { icon: ReactNode; label: string; value: ReactNode; detail: string }) => (
  <Card>
    <CardContent className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold font-mono text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="rounded-lg bg-secondary/10 p-2 text-secondary">{icon}</div>
    </CardContent>
  </Card>
);

const SignalCard = ({ title, icon, rows }: { title: string; icon: ReactNode; rows: [string, ReactNode][] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <span className="text-secondary">{icon}</span>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="font-mono font-semibold text-foreground">{value}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default AdminAnalyticsTab;
