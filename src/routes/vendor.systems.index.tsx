import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { query, queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

type SystemRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  verified: boolean;
  pricing_tier: string;
  starting_price: string;
  status: string;
  updated_at: string | null;
  category_name: string | null;
};

const getSystems = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const user = await getAuthUser(request);
  if (!user) return [];

  const member = await queryOne<{ vendor_id: string }>(
    "SELECT vendor_id FROM vendor_members WHERE user_id = $1",
    [user.id],
  );
  if (!member) return [];

  return query<SystemRow>(
    `SELECT
       s.id, s.name, s.slug, s.tagline,
       s.verified, s.pricing_tier, s.starting_price,
       s.status, s.updated_at,
       c.name AS category_name
      FROM systems s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.vendor_id = $1
      ORDER BY s.updated_at DESC`,
    [member.vendor_id],
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New system
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2">Name</th>
                <th>Status</th>
                <th>Last edit</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {systems.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{s.name}</td>
                  <td>
                    <Badge
                      variant={
                        s.status === "active"
                          ? "default"
                          : s.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">
                    {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="text-muted-foreground">you</td>
                  <td>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/vendor/systems/$id" params={{ id: s.id }}>
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
