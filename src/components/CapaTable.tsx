import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface DomainScore {
  domain_key: string;
  domain_name: string;
  score_0_100: number;
}

interface CapaTableProps {
  domainScores: DomainScore[];
}

export function CapaTable({ domainScores }: CapaTableProps) {
  // Generate CAPA items from low-scoring domains
  const capaItems = domainScores
    .filter(d => d.score_0_100 < 75)
    .map((domain, idx) => {
      const priority = domain.score_0_100 < 50 ? "Critical" : "High";
      const owner = "Security Team";
      const dueDate = new Date();
      
      // Set due dates based on priority
      if (priority === "Critical") {
        dueDate.setDate(dueDate.getDate() + 30);
      } else {
        dueDate.setDate(dueDate.getDate() + 60);
      }

      return {
        id: idx + 1,
        action: `Improve ${domain.domain_name} controls and processes`,
        owner,
        dueDate: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        priority,
        status: "Pending",
        evidenceRef: domain.domain_key.toUpperCase(),
      };
    });

  return (
    <Card className="p-6 overflow-x-auto page-break-inside-avoid">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border p-3 text-left font-heading">#</th>
            <th className="border border-border p-3 text-left font-heading">Action</th>
            <th className="border border-border p-3 text-left font-heading">Owner</th>
            <th className="border border-border p-3 text-left font-heading">Due Date</th>
            <th className="border border-border p-3 text-center font-heading">Priority</th>
            <th className="border border-border p-3 text-center font-heading">Status</th>
            <th className="border border-border p-3 text-center font-heading">Ref</th>
          </tr>
        </thead>
        <tbody>
          {capaItems.length === 0 ? (
            <tr>
              <td colSpan={7} className="border border-border p-6 text-center text-muted-foreground">
                No corrective actions required. All domains meet acceptable thresholds.
              </td>
            </tr>
          ) : (
            capaItems.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="border border-border p-3 text-center font-mono">
                  {item.id}
                </td>
                <td className="border border-border p-3">
                  {item.action}
                </td>
                <td className="border border-border p-3">
                  {item.owner}
                </td>
                <td className="border border-border p-3 font-mono text-xs">
                  {item.dueDate}
                </td>
                <td className="border border-border p-3 text-center">
                  <Badge
                    className={`${
                      item.priority === "Critical"
                        ? "bg-[#C0392B]"
                        : "bg-[#F5B041]"
                    } text-white text-xs`}
                  >
                    {item.priority}
                  </Badge>
                </td>
                <td className="border border-border p-3 text-center">
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                </td>
                <td className="border border-border p-3 text-center font-mono text-xs">
                  {item.evidenceRef}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {capaItems.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> These corrective actions are automatically generated based on 
            domain scores below 75. Each action should be assigned to appropriate personnel and 
            tracked through to completion. Evidence of remediation should be documented against 
            the reference code.
          </p>
        </div>
      )}
    </Card>
  );
}
