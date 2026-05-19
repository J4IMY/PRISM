import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { mockScraperItems } from "@/lib/mock-data";

export const Route = createFileRoute("/moderator/item/$id")({
  loader: ({ params }) => {
    const item = mockScraperItems.find((i) => i.id === params.id);
    if (!item) throw notFound();
    return { item };
  },
  component: ModeratorItemPage,
});

function ModeratorItemPage() {
  const { item } = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <Link to="/moderator/queue" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" />Back to queue</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">From {item.source} · confidence {Math.round(item.confidence*100)}%</p>
        </div>
        <Badge variant="outline">{item.status}</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <CardTitle className="text-sm">Possible duplicate: Nimbus CRM (94% match)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Merge with existing record or keep as new system.
          <div className="mt-3 flex gap-2"><Button size="sm" variant="outline">Merge</Button><Button size="sm" variant="ghost">Ignore</Button></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Raw (scraped)</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {item.name}</div>
            <div><span className="text-muted-foreground">URL:</span> https://{item.source}/listing/{item.id}</div>
            <div className="text-muted-foreground">{`Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${item.name} is a software platform that...`}</div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Cleaned</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Name</Label><Input defaultValue={item.name} /></div>
            <div><Label>Vendor</Label><Input /></div>
            <div><Label>Tagline</Label><Input /></div>
            <div><Label>Description</Label><Textarea rows={4} /></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline">Escalate to admin</Button>
        <Button variant="destructive">Reject</Button>
        <Button>Mark ready → publish</Button>
      </div>
    </div>
  );
}
