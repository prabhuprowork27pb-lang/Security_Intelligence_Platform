import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Target } from "lucide-react";
import { stripCost } from "@/lib/stripCost";

interface RoadmapAction {
  title: string;
  description?: string;
  owner?: string;
  impact?: string;
}

interface RemediationRoadmapProps {
  remediationPlan: string;
}

export const RemediationRoadmap = ({ remediationPlan }: RemediationRoadmapProps) => {
  let roadmapData: any = null;

  try {
    const plan = JSON.parse(remediationPlan);
    roadmapData = plan.roadmap;
  } catch (error) {
    console.error("Failed to parse remediation plan:", error);
    return null;
  }

  if (!roadmapData || (!roadmapData.days_30 && !roadmapData.days_60 && !roadmapData.days_90)) {
    return null;
  }

  const parseAction = (action: string): RoadmapAction => {
    return {
      title: stripCost(action),
    };
  };

  const getImpactColor = (impact?: string) => {
    switch (impact?.toLowerCase()) {
      case "quick win": return "default";
      case "medium impact": return "secondary";
      case "strategic": return "outline";
      default: return "outline";
    }
  };

  const renderActionsList = (actions: string[], icon: any, color: string) => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className="space-y-3">
        {actions.map((action, index) => {
          const parsed = parseAction(action);
          return (
            <Card key={index} className="p-4 border-l-4" style={{ borderLeftColor: `hsl(var(--${color}))` }}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 text-${color}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{parsed.title}</p>
                  {parsed.description && (
                    <p className="text-sm text-muted-foreground mt-1">{parsed.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {parsed.owner && (
                      <Badge variant="outline" className="text-xs">
                        {parsed.owner}
                      </Badge>
                    )}
                    {parsed.impact && (
                      <Badge variant={getImpactColor(parsed.impact)} className="text-xs">
                        {parsed.impact}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Action Plan</h2>
        <p className="text-muted-foreground">
          Structured action plan across 30, 60, and 90-day horizons
        </p>
      </div>

      <Tabs defaultValue="30" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="30" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            0-30 Days
          </TabsTrigger>
          <TabsTrigger value="60" className="gap-2">
            <Clock className="h-4 w-4" />
            31-60 Days
          </TabsTrigger>
          <TabsTrigger value="90" className="gap-2">
            <Target className="h-4 w-4" />
            61-90 Days
          </TabsTrigger>
        </TabsList>

        <TabsContent value="30" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Quick Wins</h3>
            <p className="text-sm text-muted-foreground">
              Low-hanging fruit that can be implemented quickly to show immediate improvement
            </p>
          </div>
          {renderActionsList(
            roadmapData.days_30,
            <CheckCircle2 className="h-5 w-5" />,
            "primary"
          )}
        </TabsContent>

        <TabsContent value="60" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Foundation Building</h3>
            <p className="text-sm text-muted-foreground">
              Essential controls to strengthen baseline security posture
            </p>
          </div>
          {renderActionsList(
            roadmapData.days_60,
            <Clock className="h-5 w-5" />,
            "secondary"
          )}
        </TabsContent>

        <TabsContent value="90" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Strategic Initiatives</h3>
            <p className="text-sm text-muted-foreground">
              Long-term moves to strengthen systems, process and security culture
            </p>
          </div>
          {renderActionsList(
            roadmapData.days_90,
            <Target className="h-5 w-5" />,
            "accent"
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
