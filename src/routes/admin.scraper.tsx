import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockScraperItems } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/scraper")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Scraper queue</h1>
      <Card><CardContent className="pt-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2"><input type="checkbox" /></th>
            <th>Name</th><th>Source</th><th>Confidence</th><th>Age</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {mockScraperItems.map((it) => (
              <tr key={it.id} className="border-b border-border last:border-0">
                <td className="py-3"><input type="checkbox" /></td>
                <td className="font-medium">{it.name}</td>
                <td className="text-muted-foreground">{it.source}</td>
                <td>{Math.round(it.confidence * 100)}%</td>
                <td className="text-muted-foreground">{it.ageDays}d</td>
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
  ),
});
