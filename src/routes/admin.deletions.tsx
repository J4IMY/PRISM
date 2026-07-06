import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { query } from "@/lib/db";

const getDeletionRequests = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string;
    email: string;
    requested_at: string;
    sla_days_left: number;
    status: string;
  }>(
    `SELECT id, email, requested_at, sla_days_left, status
     FROM deletion_requests
     ORDER BY requested_at DESC`,
  );
});

export const Route = createFileRoute("/admin/deletions")({
  loader: async () => {
    const requests = await getDeletionRequests();
    return { requests };
  },
  component: AdminDeletionsPage,
});

function AdminDeletionsPage() {
  const { requests } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Deletion requests</h1>
      <p className="text-sm text-muted-foreground">GDPR SLA: 30 days from request.</p>
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2">User</th>
                <th>Requested</th>
                <th>SLA left</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{r.email}</td>
                  <td className="text-muted-foreground">{r.requested_at}</td>
                  <td>
                    <Badge variant={r.sla_days_left < 7 ? "destructive" : "outline"}>
                      {r.sla_days_left}d
                    </Badge>
                  </td>
                  <td>
                    <Badge variant="secondary">{r.status}</Badge>
                  </td>
                  <td className="space-x-1">
                    <Button size="sm" variant="outline">
                      Anonymize
                    </Button>
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
