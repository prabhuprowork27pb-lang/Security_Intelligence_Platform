import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Plus, GitCompare } from "lucide-react";

interface Organisation {
  id: string;
  name: string;
  industry: string;
  city: string | null;
}

interface Site {
  id: string;
  name: string;
  city: string;
  state: string | null;
  site_type: string;
  criticality: string;
}

const OrganisationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: orgData } = await supabase
      .from("organisations")
      .select("*")
      .eq("id", id)
      .single();

    const { data: sitesData } = await supabase
      .from("sites")
      .select("*")
      .eq("organisation_id", id)
      .order("created_at", { ascending: false });

    setOrganisation(orgData);
    setSites(sitesData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Organisation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Command Center
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-3">{organisation.name}</h1>
          <p className="text-lg text-muted-foreground flex items-center gap-2">
            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg font-medium">{organisation.industry}</span>
            {organisation.city && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>{organisation.city}</span>
              </>
            )}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-3xl font-heading font-bold">Operating Sites</h2>
            <div className="flex items-center gap-2">
              {sites.length >= 2 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(`/organisations/${id}/compare`)}
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare sites
                </Button>
              )}
              <Button onClick={() => navigate(`/organisations/${id}/sites/new`)} size="lg" className="bg-secondary hover:bg-secondary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </div>
          </div>

          {sites.length === 0 ? (
            <Card className="premium-card p-16 text-center border-dashed border-2">
              <div className="p-4 rounded-full bg-muted/50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-heading font-semibold mb-3">No sites yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Add your first site to start conducting Security Selfie assessments
              </p>
              <Button onClick={() => navigate(`/organisations/${id}/sites/new`)} size="lg" className="bg-secondary hover:bg-secondary/90">
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Site
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <Card
                  key={site.id}
                  className="premium-card p-6 cursor-pointer border-l-4 border-l-secondary/50 hover:border-l-secondary group"
                  onClick={() => navigate(`/sites/${site.id}`)}
                >
                  <div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 w-fit mb-4 transition-colors">
                    <MapPin className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-2 group-hover:text-secondary transition-colors">{site.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {site.city}{site.state && `, ${site.state}`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-3 py-1 bg-secondary/10 text-secondary rounded-full font-medium">
                      {site.site_type}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      site.criticality === "high" 
                        ? "bg-score-low/10 text-score-low" 
                        : site.criticality === "medium"
                        ? "bg-score-medium/10 text-score-medium"
                        : "bg-score-high/10 text-score-high"
                    }`}>
                      {site.criticality}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrganisationDetail;