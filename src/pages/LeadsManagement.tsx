import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Phone, Building, MapPin } from "lucide-react";

const LeadsManagement = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("dslr_leads")
      .select(`
        *,
        organisations(name, city),
        sites(name, city)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "contacted": return "secondary";
      case "qualified": return "outline";
      case "converted": return "outline";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspace
            </Button>
            <div>
              <h1 className="text-2xl font-heading font-bold">Security Studio™ Inquiries</h1>
              <p className="text-sm text-primary-foreground/80">Senior-led engagement requests</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 font-mono">
            {leads.length} Total Leads
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid gap-6">
          {leads.length === 0 ? (
            <Card className="premium-card p-16 text-center">
              <p className="text-lg text-muted-foreground">No Security Studio™ inquiries yet.</p>
            </Card>
          ) : (
            leads.map((lead) => (
              <Card key={lead.id} className="premium-card p-6 border-l-4 border-l-secondary">\
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground">{lead.role}</p>
                  </div>
                  <Badge variant={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                  </div>
                  
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}

                  {lead.organisations && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.organisations.name}</span>
                    </div>
                  )}

                  {lead.sites && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.sites.name}, {lead.sites.city}</span>
                    </div>
                  )}
                </div>

                {lead.message && (
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-sm font-medium mb-2">Key Concerns / Focus Areas:</p>
                    <p className="text-sm text-muted-foreground">{lead.message}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-4">
                  Submitted: {new Date(lead.created_at).toLocaleString()}
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default LeadsManagement;
