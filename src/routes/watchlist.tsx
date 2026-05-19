import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { mockSystems } from "@/lib/mock-data";

export const Route = createFileRoute("/watchlist")({
  component: WatchlistPage,
});

function WatchlistPage() {
  const items = mockSystems.slice(0, 4);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Your watchlist</h1>
            <p className="text-sm text-muted-foreground">{items.length} systems saved</p>
          </div>
          <Button asChild><Link to="/compare">Compare selected</Link></Button>
        </div>
        <div className="space-y-3">
          {items.map((s) => (
            <Card key={s.id}><CardContent className="pt-6 flex items-center gap-4">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <div className="h-10 w-10 rounded-md bg-secondary" />
              <div className="flex-1">
                <Link to="/systems/$slug" params={{ slug: s.slug }} className="font-medium hover:underline">{s.name}</Link>
                <p className="text-xs text-muted-foreground">{s.vendor}</p>
              </div>
              <Badge variant="outline">{s.pricingTier}</Badge>
              <div className="text-sm text-right">
                <div className="text-muted-foreground text-xs">Est. 3yr TCO</div>
                <div className="font-medium">$182k</div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
      </main>
    </div>
  );
}
