import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockThreads } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/vendors")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vendor inbox</h1>
      <Card><CardContent className="pt-6 divide-y divide-border">
        {mockThreads.map((t) => (
          <div key={t.id} className="py-3 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium">{t.with}</p>
              <p className="text-sm text-muted-foreground">{t.subject} — {t.lastMessage}</p>
            </div>
            {t.unread > 0 && <Badge>{t.unread}</Badge>}
            <span className="text-xs text-muted-foreground">{t.updated} ago</span>
            <Button size="sm" variant="outline">Open</Button>
          </div>
        ))}
      </CardContent></Card>
    </div>
  ),
});
