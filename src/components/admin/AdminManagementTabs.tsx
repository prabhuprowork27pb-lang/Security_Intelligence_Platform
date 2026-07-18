import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardList, IndianRupee, Loader2, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchPricing, formatINR, updatePricing } from "@/lib/pricing";
import ReportsQueueTab from "@/components/admin/ReportsQueueTab";
import PulseRefreshButton from "@/components/admin/PulseRefreshButton";

interface RoleRow { user_id: string; role: string; }
interface AssessmentRow { id: string; created_by_name: string; status: string | null; paid: boolean; created_at: string | null; overall_score_0_100: number | null; site_id: string; user_id: string | null; review_status: string | null; reviewed_by_name: string | null; }
interface LeadRow { id: string; name: string; email: string; phone: string | null; message: string | null; status: string | null; created_at: string | null; }
interface PaymentRow { id: string; user_id: string; amount_inr: number; status: string; created_at: string; }
interface BetaTester { user_id: string; email: string; created_at: string; }

const AdminManagementTabs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [price, setPrice] = useState<number>(4999);
  const [savingPrice, setSavingPrice] = useState(false);
  const [betaTesters, setBetaTesters] = useState<BetaTester[]>([]);
  const [betaEmail, setBetaEmail] = useState("");
  const [betaBusy, setBetaBusy] = useState(false);

  const loadBetaTesters = async () => {
    const { data, error } = await supabase.functions.invoke("manage-beta-testers", {
      body: { action: "list" },
    });
    if (error) {
      toast({ title: "Could not load beta testers", description: error.message, variant: "destructive" });
      return;
    }
    setBetaTesters((data?.testers ?? []) as BetaTester[]);
  };

  const grantBetaTester = async () => {
    const email = betaEmail.trim();
    if (!email) return;
    setBetaBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-beta-testers", {
      body: { action: "grant", email },
    });
    setBetaBusy(false);
    if (error || data?.error) {
      toast({ title: "Could not grant access", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    if (data?.invited) {
      toast({ title: "Invite sent", description: `Beta access will activate after ${email} accepts the invite and signs in.` });
    } else {
      toast({ title: "Beta access granted", description: email });
    }
    setBetaEmail("");
    loadBetaTesters();
  };

  const revokeBetaTester = async (t: BetaTester) => {
    if (!confirm(`Revoke beta access for ${t.email}?`)) return;
    const { data, error } = await supabase.functions.invoke("manage-beta-testers", {
      body: { action: "revoke", user_id: t.user_id },
    });
    if (error || data?.error) {
      toast({ title: "Could not revoke", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Beta access revoked" });
    loadBetaTesters();
  };

  useEffect(() => {
    (async () => {
      const [rolesRes, aRes, lRes, pRes, pricing] = await Promise.all([
        supabase.from("user_roles" as any).select("user_id, role"),
        supabase.from("assessments").select("id, created_by_name, status, paid, created_at, overall_score_0_100, site_id, user_id, review_status, reviewed_by_name" as any).order("created_at", { ascending: false }),
        supabase.from("dslr_leads").select("id, name, email, phone, message, status, created_at").order("created_at", { ascending: false }),
        supabase.from("payments" as any).select("id, user_id, amount_inr, status, created_at").order("created_at", { ascending: false }),
        fetchPricing(),
      ]);
      setRoles(((rolesRes.data ?? []) as any) as RoleRow[]);
      setAssessments(((aRes.data ?? []) as any) as AssessmentRow[]);
      setLeads(((lRes.data ?? []) as any) as LeadRow[]);
      setPayments(((pRes.data ?? []) as any) as PaymentRow[]);
      setPrice(pricing.assessment_price_inr);
      setLoading(false);
      loadBetaTesters();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usersByRole = (() => {
    const map = new Map<string, Set<string>>();
    roles.forEach((r) => {
      if (!map.has(r.user_id)) map.set(r.user_id, new Set());
      map.get(r.user_id)!.add(r.role);
    });
    return Array.from(map.entries()).map(([user_id, set]) => ({
      user_id,
      roles: Array.from(set),
      payments: payments.filter((p) => p.user_id === user_id).length,
    }));
  })();

  const savePrice = async () => {
    if (!price || price < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    setSavingPrice(true);
    try {
      await updatePricing({ assessment_price_inr: Number(price), currency: "INR" });
      toast({ title: "Price updated" });
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setSavingPrice(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Users" value={usersByRole.length} />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Assessments" value={assessments.length} />
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Payments" value={payments.length} />
        <StatCard icon={<Mail className="h-5 w-5" />} label="Deep-Dive Leads" value={leads.length} />
      </div>

      <Tabs defaultValue="roles">
        <TabsList className="h-auto flex w-full flex-wrap justify-start gap-1 bg-muted/60 p-1 md:w-auto">
          <TabsTrigger value="roles">Users & Roles</TabsTrigger>
          <TabsTrigger value="beta" className="data-[state=active]:text-primary">Beta Testers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="queue">Reports queue</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="pulse">Pulse</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Invite a Beta Tester</CardTitle>
              <p className="text-sm text-muted-foreground">Grant a signed-up reviewer full access without charging.</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="reviewer@example.com"
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") grantBetaTester(); }}
                  disabled={betaBusy}
                />
                <Button onClick={grantBetaTester} disabled={betaBusy || !betaEmail.trim()}>
                  {betaBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Granting…</> : "Grant beta access"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Users & Roles</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersByRole.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No users yet</TableCell></TableRow>}
                  {usersByRole.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-mono text-xs">{u.user_id.slice(0, 8)}…</TableCell>
                      <TableCell>{u.roles.map((r) => <Badge key={r} variant={r === "admin" ? "default" : "outline"} className="mr-1">{r}</Badge>)}</TableCell>
                      <TableCell className="text-right">{u.payments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Intelligence Diagnostics</CardTitle>
              <p className="text-sm text-muted-foreground">Review submitted diagnostics and release the validated report when ready.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No assessments yet</TableCell></TableRow>}
                  {assessments.map((a) => {
                    const reviewLabel = a.review_status === "report_ready" ? "Released to client" : a.review_status === "pending_review" ? "Initial release pending" : a.status ?? "Draft";
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>{a.created_by_name}</TableCell>
                        <TableCell><Badge variant={a.review_status === "report_ready" ? "default" : "outline"}>{reviewLabel}</Badge></TableCell>
                        <TableCell>{a.paid ? <Badge>Paid</Badge> : <Badge variant="outline">Free</Badge>}</TableCell>
                        <TableCell className="text-right font-mono">{a.overall_score_0_100?.toFixed(0) ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {a.review_status !== "report_ready" && a.overall_score_0_100 !== null && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from("assessments")
                                    .update({
                                      review_status: "report_ready",
                                      report_ready_at: new Date().toISOString(),
                                      reviewed_by_name: "SIP™ Advisory Team",
                                      reviewed_by_role: "Validated Intelligence Review",
                                      status: "completed",
                                    } as any)
                                    .eq("id", a.id);
                                  if (error) {
                                    toast({ title: "Could not release report", description: error.message, variant: "destructive" });
                                    return;
                                  }
                                  toast({ title: "Override release", description: "The client can now access the full report." });
                                  setAssessments((prev) => prev.map((row) => row.id === a.id ? { ...row, review_status: "report_ready" } : row));
                                }}
                                title="Manually release if auto-release failed"
                              >
                                Override release
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/assessments/${a.id}`)}>Open <ArrowRight className="ml-1 h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No payments yet</TableCell></TableRow>}
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">{payment.user_id.slice(0, 8)}…</TableCell>
                      <TableCell><Badge variant={payment.status === "succeeded" ? "default" : "outline"}>{payment.status}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{formatINR(payment.amount_inr)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Diagnostic Pricing</CardTitle></CardHeader>
            <CardContent className="max-w-md space-y-4">
              <p className="text-sm text-muted-foreground">Current price displayed at the unlock screen: <strong>{formatINR(price)}</strong></p>
              <div className="space-y-2">
                <Label htmlFor="price">Diagnostic price (INR)</Label>
                <Input id="price" type="number" min={0} step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              <Button onClick={savePrice} disabled={savingPrice}>{savingPrice ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save price"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Deep-Dive Leads</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No leads yet</TableCell></TableRow>}
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell><a className="text-primary hover:underline" href={`mailto:${l.email}`}>{l.email}</a></TableCell>
                      <TableCell>{l.phone ?? "—"}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">{l.message ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beta" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Beta Testers</CardTitle>
              <p className="text-sm text-muted-foreground">Grant invited reviewers full access without charging. They must sign up first.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input type="email" placeholder="reviewer@example.com" value={betaEmail} onChange={(e) => setBetaEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") grantBetaTester(); }} disabled={betaBusy} />
                <Button onClick={grantBetaTester} disabled={betaBusy || !betaEmail.trim()}>{betaBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Granting…</> : "Grant beta access"}</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {betaTesters.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No beta testers yet</TableCell></TableRow>}
                  {betaTesters.map((t) => (
                    <TableRow key={t.user_id}>
                      <TableCell>{t.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => revokeBetaTester(t)}>Revoke</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <ReportsQueueTab />
        </TabsContent>

        <TabsContent value="pulse" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Intelligence Pulse</CardTitle>
              <p className="text-sm text-muted-foreground">
                The Pulse ingest runs automatically once a day. Use this to pull fresh signals on demand.
              </p>
            </CardHeader>
            <CardContent>
              <PulseRefreshButton />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: ReactNode; label: string; value: number }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-2xl font-bold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

export default AdminManagementTabs;
