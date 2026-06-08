import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { query } from "@/lib/db";

const getVendorThreads = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string;
    subject: string;
    last_message: string;
    unread_count: number;
    updated_at: string;
  }>(
    `SELECT id, subject, last_message, unread_count, updated_at
     FROM vendor_threads
     ORDER BY updated_at DESC`
  );
});

export const Route = createFileRoute("/admin/vendors")({
  loader: async () => {
    const threads = await getVendorThreads();
    return { threads };
  },
  component: AdminVendorsPage,
});

function AdminVendorsPage() {
  const { threads } = Route.useLoaderData();

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffHours < 1) return "now";
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vendor inbox</h1>
      <Card><CardContent className="pt-6 divide-y divide-border">
        {threads.map((t) => (
          <div key={t.id} className="py-3 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium">{t.subject}</p>
              <p className="text-sm text-muted-foreground">{t.last_message}</p>
            </div>
            {t.unread_count > 0 && <Badge>{t.unread_count}</Badge>}
            <span className="text-xs text-muted-foreground">{formatTime(t.updated_at)} ago</span>
            <Button size="sm" variant="outline">Open</Button>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
