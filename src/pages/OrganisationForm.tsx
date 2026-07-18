import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { INDUSTRIES, isOtherValue } from "@/lib/siteTypes";

const OrganisationForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "it_ites",
    industry_custom: "",
    city: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isOtherValue(formData.industry) && formData.industry_custom.trim().length < 2) {
      toast({ title: "Please describe your industry", description: "A short description helps us tag your organisation correctly.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const payload: any = {
      name: formData.name,
      industry: formData.industry,
      city: formData.city,
      user_id: user?.id,
    };

    const { data, error } = await supabase
      .from("organisations")
      .insert([payload])
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create organisation", variant: "destructive" });
    } else {
      // Persist industry_custom on the user's profile when relevant.
      if (user && isOtherValue(formData.industry)) {
        await supabase
          .from("profiles")
          .update({ industry_other: formData.industry_custom.trim() } as any)
          .eq("user_id", user.id);
      }
      toast({ title: "Success", description: "Organisation created successfully" });
      navigate(`/organisations/${data.id}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-3">New Organisation</h1>
          <p className="text-lg text-muted-foreground">
            Create a new organisation to manage sites and conduct Security Selfie assessments
          </p>
        </div>

        <Card className="premium-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Organisation Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    industry: v,
                    industry_custom: isOtherValue(v) ? formData.industry_custom : "",
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOtherValue(formData.industry) && (
                <Input
                  placeholder="Describe your industry"
                  value={formData.industry_custom}
                  onChange={(e) => setFormData({ ...formData, industry_custom: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label htmlFor="city">City / HQ</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Bangalore"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Organisation"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default OrganisationForm;
