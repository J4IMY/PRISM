import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { query } from "@/lib/db";

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
     ORDER BY created_at DESC`
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
      <h1 className="text-2xl font-semibold">Scraper queue</h1>
      <Card><CardContent className="pt-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2"><input type="checkbox" /></th>
            <th>Name</th><th>Source</th><th>Confidence</th><th>Age</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-border last:border-0">
                <td className="py-3"><input type="checkbox" /></td>
                <td className="font-medium">{it.name}</td>
                <td className="text-muted-foreground">{it.source}</td>
                <td>{Math.round(it.confidence * 100)}%</td>
                <td className="text-muted-foreground">{it.age_days}d</td>
                <td><Badge variant="outline">{it.status}</Badge></td>
                <td className="space-x-1">
                  <Button size="sm" variant="outline">Open</Button>
                  <Button size="sm">Publish</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
