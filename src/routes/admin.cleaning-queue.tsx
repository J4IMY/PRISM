import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerFn } from "@tanstack/react-start";
import { query } from "@/lib/db";
import { ScraperActions } from "@/components/scraper-actions";
import { Toaster } from "@/components/ui/sonner";

const getCleaningItems = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string;
    name: string;
    source: string;
    confidence: number;
    age_days: number;
    status: string;
    created_at: string;
    assigned_to: string | null;
  }>(
    `SELECT id, name, source, confidence, age_days, status, created_at, assigned_to
     FROM scraper_items
     WHERE assigned_to IS NOT NULL
     ORDER BY created_at DESC`,
  );
});

export const Route = createFileRoute("/admin/cleaning-queue")({
  loader: async () => {
    try {
      const items = await getCleaningItems();
      return { items };
    } catch (err) {
      console.error("Failed to load cleaning queue:", err);
      return { items: [] };
    }
  },
  component: AdminCleaningQueuePage,
});

function AdminCleaningQueuePage() {
  const { items } = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  return (
    <div className="space-y-6">
      <Toaster />
      <h1 className="text-2xl font-semibold">Cleaning queue</h1>
      <Card>
        <CardContent className="pt-6 divide-y divide-border">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">No items in the cleaning queue.</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="py-3 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.source} · {it.age_days}d old · confidence {Math.round(it.confidence * 100)}%
                  </p>
                </div>
                <Badge variant="outline">{it.status}</Badge>
                <Button asChild size="sm">
                  <Link to="/moderator/item/$id" params={{ id: it.id }}>
                    Open
                  </Link>
                </Button>
                <ScraperActions itemId={it.id} status={it.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
