import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { mockSystems } from "@/lib/mock-data";

export const Route = createFileRoute("/vendor/systems/")({
  component: VendorSystemsPage,
});

function VendorSystemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Systems</h1>
        <Button className="gap-2"><Plus className="h-4 w-4" />New system</Button>
      </div>
      <Card><CardContent className="pt-6">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2">Name</th><th>Status</th><th>Last edit</th><th>Owner</th><th></th>
          </tr></thead>
          <tbody>
            {mockSystems.slice(0,4).map((s, i) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{s.name}</td>
                <td><Badge variant={i === 0 ? "default" : i === 1 ? "secondary" : "outline"}>{["Published","Draft","Published","Archived"][i]}</Badge></td>
                <td className="text-muted-foreground">2 days ago</td>
                <td className="text-muted-foreground">you</td>
                <td><Button asChild size="sm" variant="outline"><Link to="/vendor/systems/$id" params={{ id: s.id }}>Edit</Link></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
