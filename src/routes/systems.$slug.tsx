import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, ShieldCheck, ExternalLink, Check, Minus } from "lucide-react";
import { mockSystems } from "@/lib/mock-data";

export const Route = createFileRoute("/systems/$slug")({
  component: SystemDetailPage,
  notFoundComponent: () => (
    <div className="p-12 text-center"><h1 className="text-2xl font-semibold">System not found</h1></div>
  ),
  loader: ({ params }) => {
    const system = mockSystems.find((s) => s.slug === params.slug);
    if (!system) throw notFound();
    return { system };
  },
});

function SystemDetailPage() {
  const { system } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-wrap items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-secondary" />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">{system.name}</h1>
              {system.verified && <Badge className="gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">by {system.vendor} · {system.category}</p>
            <p className="mt-2">{system.tagline}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Heart className="h-4 w-4" />Watchlist</Button>
            <Button className="gap-2"><MessageSquare className="h-4 w-4" />Message vendor</Button>
          </div>
        </header>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="tco">TCO Calculator</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card><CardContent className="pt-6 prose prose-sm max-w-none">
              <p>{system.description}</p>
              <p>Designed for {system.fit} teams, deployed via {system.deployment.toLowerCase()}.</p>
            </CardContent></Card>
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard label="Compliance" value={system.compliance.join(", ")} />
              <InfoCard label="Integrations" value={system.integrations.join(", ")} />
              <InfoCard label="Starting price" value={system.startingPrice} />
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="grid gap-4 md:grid-cols-3">
              {["Starter", "Growth", "Enterprise"].map((t, i) => (
                <Card key={t}>
                  <CardHeader><CardTitle>{t}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-semibold">${[15, 49, 0][i] || "Custom"}{i < 2 && <span className="text-sm text-muted-foreground">/seat/mo</span>}</div>
                    <Separator />
                    <ul className="space-y-1 text-sm">
                      <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Core features</li>
                      <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Email support</li>
                      {i >= 1 && <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Advanced reporting</li>}
                      {i === 2 && <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Dedicated CSM</li>}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="features">
            <Card><CardContent className="pt-6">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Single sign-on (SSO)", true, true, true],
                    ["Audit log", false, true, true],
                    ["Custom roles", false, true, true],
                    ["SLA 99.99%", false, false, true],
                    ["On-prem deployment", false, false, true],
                  ].map(([name, ...vals]) => (
                    <tr key={name as string} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium">{name as string}</td>
                      {vals.map((v, i) => (
                        <td key={i} className="py-2 text-center">
                          {v ? <Check className="inline h-4 w-4 text-primary" /> : <Minus className="inline h-4 w-4 text-muted-foreground" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="tco">
            <Card><CardContent className="pt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div><Label>Seats</Label><Input type="number" defaultValue={50} /></div>
                <div><Label>Term length</Label>
                  <select className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>1 year</option><option>3 years</option><option>5 years</option>
                  </select>
                </div>
                <div><Label>Annual escalation %</Label><Slider defaultValue={[5]} max={20} step={1} className="mt-3" /></div>
                <div><Label>Discount %</Label><Slider defaultValue={[10]} max={50} step={1} className="mt-3" /></div>
                <div><Label>Implementation cost</Label><Input type="number" defaultValue={5000} /></div>
              </div>
              <div className="rounded-lg bg-secondary p-6 space-y-3">
                <div className="text-sm text-muted-foreground">Estimated TCO (3 years)</div>
                <div className="text-4xl font-semibold">$182,400</div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Year 1</span><span>$56,000</span></div>
                  <div className="flex justify-between"><span>Year 2</span><span>$60,800</span></div>
                  <div className="flex justify-between"><span>Year 3</span><span>$65,600</span></div>
                </div>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="media">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-lg bg-secondary" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="links">
            <Card><CardContent className="pt-6 space-y-2">
              {[
                ["Website", "https://example.com"],
                ["Documentation", "https://docs.example.com"],
                ["LinkedIn", "https://linkedin.com/company/example"],
                ["YouTube demo", "https://youtube.com/example"],
              ].map(([l, h]) => (
                <Link key={l} to="." className="flex items-center gap-2 text-sm hover:underline">
                  <ExternalLink className="h-4 w-4" /> {l} <span className="text-muted-foreground">— {h}</span>
                </Link>
              ))}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="pt-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </CardContent></Card>
  );
}
