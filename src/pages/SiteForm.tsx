import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SITE_TYPES, INDIAN_STATES, isOtherValue } from "@/lib/siteTypes";

const SiteForm = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    country: "India",
    site_type: "it_ites",
    site_type_custom: "",
    headcount_band: "",
    criticality: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Duplicate-site guard for this user (same name + city, case-insensitive).
    if (user) {
      const { data: existing } = await supabase
        .from("sites")
        .select("id, name, city")
        .eq("user_id", user.id);
      const dupe = (existing ?? []).find((s: any) =>
        (s.name ?? "").trim().toLowerCase() === formData.name.trim().toLowerCase()
        && (s.city ?? "").trim().toLowerCase() === formData.city.trim().toLowerCase()
      );
      if (dupe) {
        toast({
          title: "Site already exists",
          description: `"${dupe.name}" in ${dupe.city} is already on your account. Open it from your Command Centre, or differentiate the name (e.g. add a building or wing) if this is genuinely a different location.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    if (isOtherValue(formData.site_type) && formData.site_type_custom.trim().length < 2) {
      toast({ title: "Please describe the site type", description: "A short description helps us classify this site correctly.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      site_type_other: isOtherValue(formData.site_type) ? formData.site_type_custom.trim() : null,
    };
    // site_type_custom isn't a DB column — strip before insert.
    delete (payload as any).site_type_custom;

    const { data, error } = await supabase
      .from("sites")
      .insert([{ ...payload, organisation_id: orgId, user_id: user?.id } as any])
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create site", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Site created successfully" });
      navigate(`/sites/${data.id}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate(`/organisations/${orgId}`)} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-3">New Site</h1>
          <p className="text-lg text-muted-foreground">
            Add a new site to conduct Security Selfie assessments
          </p>
        </div>

        <Card className="premium-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Site Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bangalore Tech Park"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Bangalore"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="site_type">Site Type</Label>
                <Select
                  value={formData.site_type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      site_type: value,
                      site_type_custom: isOtherValue(value) ? formData.site_type_custom : "",
                    })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SITE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isOtherValue(formData.site_type) && (
                  <Input
                    placeholder="Describe your site (e.g. Defence facility, Studio)"
                    value={formData.site_type_custom}
                    onChange={(e) => setFormData({ ...formData, site_type_custom: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="criticality">Criticality</Label>
                <Select value={formData.criticality} onValueChange={(value) => setFormData({ ...formData, criticality: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="headcount_band">Headcount Band</Label>
              <Select value={formData.headcount_band} onValueChange={(value) => setFormData({ ...formData, headcount_band: value })}>
                <SelectTrigger><SelectValue placeholder="Select headcount" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="<500">Less than 500</SelectItem>
                  <SelectItem value="500-1500">500 - 1500</SelectItem>
                  <SelectItem value=">1500">More than 1500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Site"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/organisations/${orgId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default SiteForm;
