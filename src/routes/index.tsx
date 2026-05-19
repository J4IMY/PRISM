import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Search, ShieldCheck, Sparkles } from "lucide-react";
import { mockSystems } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover enterprise software — PRISM" },
      { name: "description", content: "Search, filter, and compare enterprise software systems with verified vendor data and TCO calculators." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Discover the right software for your stack</h1>
          <p className="mt-2 text-muted-foreground">Compare pricing, features, and total cost of ownership across hundreds of vendors.</p>
          <div className="mt-6 flex gap-2">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search CRM, ERP, helpdesk…" className="pl-9" />
            </div>
            <Button>Search</Button>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <FilterGroup title="Category" options={["CRM", "ERP", "Analytics", "Support", "HR", "Security"]} />
            <FilterGroup title="Pricing tier" options={["Free", "$", "$$", "$$$"]} />
            <FilterGroup title="Deployment" options={["Cloud", "On-prem", "Hybrid"]} />
            <FilterGroup title="Company size" options={["SMB", "Mid", "Enterprise"]} />
            <FilterGroup title="Compliance" options={["SOC2", "ISO27001", "HIPAA", "GDPR"]} />
          </aside>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{mockSystems.length} systems</p>
              <select className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                <option>Relevance</option>
                <option>Top rated</option>
                <option>Price: low → high</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mockSystems.map((s) => (
                <Card key={s.id} className="overflow-hidden transition hover:shadow-md">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="h-10 w-10 rounded-md bg-secondary" />
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        <Link to="/systems/$slug" params={{ slug: s.slug }} className="hover:underline">
                          {s.name}
                        </Link>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{s.vendor}</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Add to watchlist">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.tagline}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{s.category}</Badge>
                      <Badge variant="outline">{s.pricingTier}</Badge>
                      {s.verified && (
                        <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                      )}
                      {s.freeTrial && (
                        <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Free trial</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-sm">
                      <span className="text-muted-foreground">From</span>
                      <span className="font-medium">{s.startingPrice}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function FilterGroup({ title, options }: { title: string; options: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div className="space-y-2">
        {options.map((o) => (
          <div key={o} className="flex items-center gap-2">
            <Checkbox id={`${title}-${o}`} />
            <Label htmlFor={`${title}-${o}`} className="text-sm font-normal text-muted-foreground">{o}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
