import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { mockAuditLog } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/audit")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <Card><CardContent className="pt-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2">When</th><th>Actor</th><th>Action</th><th>Target</th>
          </tr></thead>
          <tbody>
            {mockAuditLog.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="py-3 text-muted-foreground">{a.at}</td>
                <td>{a.actor}</td>
                <td><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">{a.action}</code></td>
                <td className="font-medium">{a.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  ),
});
