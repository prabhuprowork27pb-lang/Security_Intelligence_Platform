import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { errorToast } from "@/lib/errors";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ mobile: "", company: "", designation: "" });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?next=/profile", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        mobile: profile.mobile ?? "",
        company: profile.company ?? "",
        designation: profile.designation ?? "",
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles" as any)
      .update({
        mobile: form.mobile.trim() || null,
        company: form.company.trim() || null,
        designation: form.designation.trim() || null,
      } as any)
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) {
      toast(errorToast(error, "profile"));
      return;
    }
    await refresh();
    toast({ title: "Profile updated", description: "Your changes are saved." });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fmtDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
      : null;

  return (
    <>
      <Seo title="Your Profile" description="Manage your profile details." path="/profile" />
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 md:px-6 py-10 max-w-2xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 min-h-11">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Your Profile</CardTitle>
              <CardDescription>
                Full name and email are locked once verified. Update your role, organisation, or mobile as your career changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <LockedField label="Full name" value={profile.full_name} />
                <LockedField label="Email" value={profile.email} />
                <EditableField label="Mobile number *" id="mobile" type="tel" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
                <EditableField
                  label="Organisation *"
                  id="company"
                  value={form.company}
                  onChange={(v) => setForm({ ...form, company: v })}
                  hint={fmtDate(profile.company_locked_at) ? `Last updated ${fmtDate(profile.company_locked_at)}` : undefined}
                />
                <EditableField
                  label="Designation *"
                  id="designation"
                  value={form.designation}
                  onChange={(v) => setForm({ ...form, designation: v })}
                  hint={fmtDate(profile.designation_locked_at) ? `Last updated ${fmtDate(profile.designation_locked_at)}` : undefined}
                />
                <Button type="submit" disabled={saving} className="w-full md:w-auto min-h-11">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1.5 text-muted-foreground">
      <Lock className="h-3 w-3" aria-hidden /> {label}
    </Label>
    <Input value={value} disabled />
  </div>
);

const EditableField = ({
  label,
  id,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required />
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

export default Profile;
