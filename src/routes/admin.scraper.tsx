import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { query } from "@/lib/db";
import { ScraperActions } from "@/components/scraper-actions";
import { Toaster } from "@/components/ui/sonner";

const getScraperItems = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string;
    name: string;
    source: string;
    confidence: number;
    age_days: number;
    status: string;
    created_at: string;
  }>(
    `SELECT id, name, source, confidence, age_days, status, created_at
     FROM scraper_items
     ORDER BY created_at DESC`,
  );
});

export const Route = createFileRoute("/admin/scraper")({
  loader: async () => {
    const items = await getScraperItems();
    return { items };
  },
  component: AdminScraperPage,
});

function AdminScraperPage() {
  const { items } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <Toaster />
      <h1 className="text-2xl font-semibold">Scraper queue</h1>
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2">Name</th>
                <th>Source</th>
                <th>Confidence</th>
                <th>Age</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{it.name}</td>
                  <td className="text-muted-foreground">{it.source}</td>
                  <td>{Math.round(it.confidence * 100)}%</td>
                  <td className="text-muted-foreground">{it.age_days}d</td>
                  <td>
                    <Badge variant="outline">{it.status}</Badge>
                  </td>
                  <td>
                    <ScraperActions itemId={it.id} status={it.status} />
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
