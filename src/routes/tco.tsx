import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState } from "react";
import { query } from "@/lib/db";
import { SystemTcoCalculator, type TcoPackage } from "@/components/system-tco-calculator";

interface TcoSystem {
  id: string;
  name: string;
  slug: string;
  packages: TcoPackage[];
}

const getSystems = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await query<TcoSystem[]>(
    `SELECT s.id, s.name, s.slug,
      COALESCE(json_agg(json_build_object(
        'id', p.id, 'name', p.name, 'description', p.description,
        'pricing_model', p.pricing_model, 'currency', p.currency, 'base_price', p.base_price,
        'billing_cadence', p.billing_cadence, 'is_free', p.is_free, 'contact_sales', p.contact_sales,
        'trial_available', p.trial_available, 'trial_duration_days', p.trial_duration_days,
        'minimum_seats', p.minimum_seats, 'maximum_seats', p.maximum_seats,
        'is_unlimited_seats', p.is_unlimited_seats, 'is_popular', p.is_popular,
        'features', COALESCE(pf.features, '[]'::json)
      )) FILTER (WHERE p.id IS NOT NULL), '[]'::json) as packages
    FROM systems s
    LEFT JOIN pricing_packages p ON p.system_id = s.id
    LEFT JOIN (
      SELECT package_id, COALESCE(json_agg(feature_name), '[]'::json) as features
      FROM package_features
      GROUP BY package_id
    ) pf ON pf.package_id = p.id
    WHERE s.status = 'active'
    GROUP BY s.id, s.name, s.slug
    ORDER BY s.name`,
  );
  return rows;
});

export const Route = createFileRoute("/tco")({
  head: () => ({
    meta: [
      { title: "TCO Calculator — PRISM" },
      {
        name: "description",
        content:
          "Estimate total cost of ownership with package-based pricing and annual escalation.",
      },
    ],
  }),
  loader: async () => {
    const systems = await getSystems();
    return { systems };
  },
  component: TcoPage,
});

function TcoPage() {
  const { systems } = Route.useLoaderData() as { systems: TcoSystem[] };
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const selectedSystem = systems.find((s) => s.id === selectedSystemId);
  const packages = useMemo(() => selectedSystem?.packages ?? [], [selectedSystem]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={undefined} />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">TCO Calculator</h1>
          <p className="text-muted-foreground">
            Estimate your total cost of ownership across packages with annual escalation
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>System</Label>
                <Select
                  value={selectedSystemId}
                  onValueChange={(v) => {
                    setSelectedSystemId(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system…" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {selectedSystem ? (
          <>
            <Separator />
            <SystemTcoCalculator systemName={selectedSystem.name} packages={packages} />
          </>
        ) : null}
      </main>
    </div>
  );
}
