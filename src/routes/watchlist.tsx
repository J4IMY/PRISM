import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { query } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { requireRoles } from "@/lib/route-guards";

const getWatchlist = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const user = await getAuthUser(request);
  if (!user) return [];

  return query(
    `SELECT
       w.id AS watchlist_id,
       s.id, s.name, s.slug, s.description, s.tagline,
       s.verified, s.pricing_tier, s.starting_price,
       c.name AS category_name,
       v.company_name AS vendor_name
     FROM watchlist w
     JOIN systems s ON s.id = w.system_id
     LEFT JOIN categories c ON s.category_id = c.id
     LEFT JOIN vendors v ON s.vendor_id = v.id
     WHERE w.user_id = $1 AND s.status = 'active'
     ORDER BY w.created_at DESC`,
    [user.id]
  );
});

export const Route = createFileRoute("/watchlist")({
  beforeLoad: ({ context }) => {
    requireRoles(context.user, ["user", "vendor", "moderator", "admin"]);
  },
  loader: async () => ({ items: await getWatchlist() }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { items } = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Watchlist</h1>
        {items.length === 0 ? (
          <p className="text-muted-foreground">No saved systems yet. Browse discover to add some.</p>
        ) : (
          <div className="grid gap-4">
            {items.map((item: Record<string, unknown>) => (
              <Card key={item.id as string}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <Link to="/systems/$slug" params={{ slug: item.slug as string }} className="font-medium hover:underline">
                      {item.name as string}
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.vendor_name as string} · {item.category_name as string}</p>
                    {item.verified && <Badge variant="secondary" className="mt-1">Verified</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.starting_price as string}</span>
                    <Button variant="ghost" size="icon" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
