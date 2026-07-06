import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Minus } from "lucide-react";
import { query } from "@/lib/db";

const getSystems = createServerFn({ method: "GET" }).handler(async () => {
  return query<any>(
    `SELECT
       s.id, s.name, s.slug, s.description,
       s.deployment_type, s.pricing_tier, s.starting_price,
       s.verified, s.trial_available,
       c.name AS category_name,
       v.company_name AS vendor_name
     FROM systems s
     LEFT JOIN categories c ON s.category_id = c.id
     LEFT JOIN vendors v ON s.vendor_id = v.id
     WHERE s.status = 'active'
     ORDER BY s.verified DESC, s.rating DESC
     LIMIT 5`,
  );
});

export const Route = createFileRoute("/compare")({
  loader: async () => {
    const systems = await getSystems();
    return { systems: systems.slice(0, 3) };
  },
  component: ComparePage,
});

function ComparePage() {
  const { systems } = Route.useLoaderData();
  const rows: Array<[string, (s: any) => React.ReactNode]> = [
    ["Vendor", (s) => s.vendor_name || "—"],
    ["Category", (s) => s.category_name || "—"],
    ["Pricing tier", (s) => s.pricing_tier || "—"],
    ["Deployment", (s) => s.deployment_type || "—"],
    ["Starting price", (s) => s.starting_price || "—"],
    [
      "Free trial",
      (s) =>
        s.trial_available ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ),
    ],
    [
      "Verified",
      (s) =>
        s.verified ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ),
    ],
    ["Est. 3yr TCO", () => "$182,400"],
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Compare systems</h1>
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 font-medium text-muted-foreground">
                    Attribute
                  </th>
                  {systems.map((s) => (
                    <th key={s.id} className="text-left py-3 pr-4 font-semibold">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, getter]) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{label}</td>
                    {systems.map((s) => (
                      <td key={s.id} className="py-2 pr-4">
                        {getter(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
