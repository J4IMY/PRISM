import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockScraperItems } from "@/lib/mock-data";

export const Route = createFileRoute("/moderator/queue")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My queue</h1>
      <Card><CardContent className="pt-6 divide-y divide-border">
        {mockScraperItems.map((it) => (
          <div key={it.id} className="py-3 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium">{it.name}</p>
              <p className="text-xs text-muted-foreground">{it.source} · {it.ageDays}d old · confidence {Math.round(it.confidence*100)}%</p>
            </div>
            <Badge variant="outline">{it.status}</Badge>
            <Button asChild size="sm"><Link to="/moderator/item/$id" params={{ id: it.id }}>Open</Link></Button>
          </div>
        ))}
      </CardContent></Card>
    </div>
  ),
});
