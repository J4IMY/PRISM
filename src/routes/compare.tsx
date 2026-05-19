import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Minus } from "lucide-react";
import { mockSystems } from "@/lib/mock-data";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
});

function ComparePage() {
  const systems = mockSystems.slice(0, 3);
  const rows: Array<[string, (s: typeof systems[number]) => React.ReactNode]> = [
    ["Vendor", (s) => s.vendor],
    ["Category", (s) => s.category],
    ["Pricing tier", (s) => s.pricingTier],
    ["Deployment", (s) => s.deployment],
    ["Fit", (s) => s.fit],
    ["Starting price", (s) => s.startingPrice],
    ["Free trial", (s) => s.freeTrial ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 text-muted-foreground" />],
    ["Verified", (s) => s.verified ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 text-muted-foreground" />],
    ["Compliance", (s) => s.compliance.join(", ")],
    ["Integrations", (s) => s.integrations.join(", ")],
    ["Est. 3yr TCO", () => "$182,400"],
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Compare systems</h1>
        <Card><CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Attribute</th>
                {systems.map((s) => (
                  <th key={s.id} className="text-left py-3 pr-4 font-semibold">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, getter]) => (
                <tr key={label} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 text-muted-foreground">{label}</td>
                  {systems.map((s) => <td key={s.id} className="py-2 pr-4">{getter(s)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      </main>
    </div>
  );
}
