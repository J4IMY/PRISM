import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { query } from "@/lib/db";

const getAuditLog = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string;
    actor: string;
    action: string;
    target: string;
    created_at: string;
  }>(
    `SELECT id, actor, action, target, created_at
     FROM audit_log
     ORDER BY created_at DESC
     LIMIT 100`
  );
});

export const Route = createFileRoute("/admin/audit")({
  loader: async () => {
    const entries = await getAuditLog();
    return { entries };
  },
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { entries } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <Card><CardContent className="pt-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2">When</th><th>Actor</th><th>Action</th><th>Target</th>
          </tr></thead>
          <tbody>
            {entries.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="py-3 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                <td>{a.actor}</td>
                <td><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">{a.action}</code></td>
                <td className="font-medium">{a.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
