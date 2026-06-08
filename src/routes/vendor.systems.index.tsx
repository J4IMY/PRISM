import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { query } from "@/lib/db";

const getSystems = createServerFn({ method: "GET" }).handler(async () => {
  return query<any>(
    `SELECT
       s.id, s.name, s.slug, s.tagline,
       s.verified, s.pricing_tier, s.starting_price,
       c.name AS category_name
     FROM systems s
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.status = 'active'
     ORDER BY s.verified DESC, s.rating DESC
     LIMIT 4`
  );
});

export const Route = createFileRoute("/vendor/systems/")({
  loader: async () => {
    const systems = await getSystems();
    return { systems };
  },
  component: VendorSystemsPage,
});

function VendorSystemsPage() {
  const { systems } = Route.useLoaderData();

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
            {systems.slice(0,4).map((s, i) => (
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
