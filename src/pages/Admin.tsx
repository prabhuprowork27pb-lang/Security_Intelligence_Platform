import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, Users, ClipboardList, IndianRupee, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchPricing, updatePricing, formatINR } from "@/lib/pricing";

interface RoleRow { user_id: string; role: string; }
interface AssessmentRow { id: string; created_by_name: string; status: string | null; paid: boolean; created_at: string | null; overall_score_0_100: number | null; site_id: string; user_id: string | null; review_status: string | null; reviewed_by_name: string | null; }
interface LeadRow { id: string; name: string; email: string; phone: string | null; message: string | null; status: string | null; created_at: string | null; }
interface PaymentRow { id: string; user_id: string; amount_inr: number; status: string; created_at: string; }
interface BetaTester { user_id: string; email: string; created_at: string; }

const Admin = () => {
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
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="mb-2"><ShieldCheck className="mr-1 h-3 w-3" /> Admin</Badge>
            <h1 className="text-4xl font-heading font-bold">Admin Console</h1>
            <p className="text-muted-foreground">Users, assessments, payments and pricing.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Command Center</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users className="h-5 w-5" />} label="Users" value={usersByRole.length} />
          <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Assessments" value={assessments.length} />
          <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Payments" value={payments.length} />
          <StatCard icon={<Mail className="h-5 w-5" />} label="Deep-Dive Leads" value={leads.length} />
        </div>

        <Tabs defaultValue="users">
          <TabsList className="h-auto flex w-full flex-wrap justify-start gap-1 max-w-3xl">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="beta">Beta Testers</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Users & Roles</CardTitle>
              </CardHeader>
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
                    {usersByRole.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users yet</TableCell></TableRow>
                    )}
                    {usersByRole.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-mono text-xs">{u.user_id.slice(0, 8)}…</TableCell>
                        <TableCell>
                          {u.roles.map((r) => (
                            <Badge key={r} variant={r === "admin" ? "default" : "outline"} className="mr-1">{r}</Badge>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">{u.payments}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beta" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Beta Testers</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Grant invited reviewers full access (bypass paywall) without charging. They must sign up first.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {betaTesters.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No beta testers yet</TableCell></TableRow>
                    )}
                    {betaTesters.map((t) => (
                      <TableRow key={t.user_id}>
                        <TableCell>{t.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => revokeBetaTester(t)}>Revoke</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="assessments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Intelligence Diagnostics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review submitted diagnostics and release the validated report when ready.
                </p>
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
                    {assessments.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No assessments yet</TableCell></TableRow>
                    )}
                    {assessments.map((a) => {
                      const reviewLabel =
                        a.review_status === "report_ready"
                          ? "Released to client"
                          : a.review_status === "pending_review"
                          ? "Initial release pending"
                          : a.status ?? "Draft";
                      const reviewVariant = a.review_status === "report_ready" ? "default" : "outline";
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>{a.created_by_name}</TableCell>
                          <TableCell>
                            <Badge variant={reviewVariant as any}>{reviewLabel}</Badge>
                          </TableCell>
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
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/assessments/${a.id}`)}>
                                Open <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
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

          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <p className="text-sm text-muted-foreground">
                  Current price displayed at the unlock screen: <strong>{formatINR(price)}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="price">Diagnostic price (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
                <Button onClick={savePrice} disabled={savingPrice}>
                  {savingPrice ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save price"}
                </Button>
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
                    {leads.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No leads yet</TableCell></TableRow>
                    )}
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
        </Tabs>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold font-mono">{value}</div>
      </div>
    </CardContent>
  </Card>
);

export default Admin;
