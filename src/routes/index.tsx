import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { query } from "@/lib/db";

const getSystems = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string; name: string; slug: string; tagline: string;
    pricing_tier: string; starting_price: string; verified: boolean;
    trial_available: boolean; rating: string; review_count: number;
    category_name: string; vendor_name: string;
    has_api: boolean; has_mobile_app: boolean; has_ai_features: boolean;
    deployment_type: string; target_size: string;
    security_certifications: string[];
  }>(
    `SELECT
       s.id, s.name, s.slug, s.tagline,
       s.pricing_tier, s.starting_price, s.verified,
       s.trial_available, s.rating, s.review_count,
       s.has_api, s.has_mobile_app, s.has_ai_features,
       s.deployment_type, s.target_size,
       s.security_certifications,
       c.name AS category_name,
       v.company_name AS vendor_name
     FROM systems s
     LEFT JOIN categories c ON s.category_id = c.id
     LEFT JOIN vendors v ON s.vendor_id = v.id
     WHERE s.status = 'active'
     ORDER BY s.verified DESC, s.rating DESC, s.review_count DESC`
  );
});

const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  return query<{ name: string; system_count: number }>(
    `SELECT c.name, COUNT(s.id)::int AS system_count
     FROM categories c
     LEFT JOIN systems s ON s.category_id = c.id AND s.status = 'active'
     GROUP BY c.id, c.name
     HAVING COUNT(s.id) > 0
     ORDER BY c.sort_order`
  );
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover enterprise software — PRISM" },
      { name: "description", content: "Search, filter, and compare enterprise software systems with verified vendor data and TCO calculators." },
    ],
  }),
  loader: async () => {
    const [systems, categories] = await Promise.all([getSystems(), getCategories()]);
    return { systems, categories };
  },
  component: HomePage,
});

function HomePage() {
  const { systems, categories } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Discover the right software for your stack</h1>
          <p className="mt-2 text-muted-foreground">Compare pricing, features, and total cost of ownership across {systems.length} verified vendors.</p>
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
            <FilterGroup title="Category" options={categories.map(c => c.name)} />
            <FilterGroup title="Pricing tier" options={["Free", "$", "$$", "$$$"]} />
            <FilterGroup title="Deployment" options={["Cloud", "On-prem", "Hybrid"]} />
            <FilterGroup title="Company size" options={["SMB", "Mid", "Enterprise"]} />
            <FilterGroup title="Compliance" options={["SOC2", "ISO27001", "HIPAA", "GDPR"]} />
          </aside>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{systems.length} systems</p>
              <select className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                <option>Relevance</option>
                <option>Top rated</option>
                <option>Price: low → high</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {systems.map((s) => (
                <Card key={s.id} className="overflow-hidden transition hover:shadow-md">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-base font-bold text-secondary-foreground">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">
                        <Link to="/systems/$slug" params={{ slug: s.slug }} className="hover:underline">
                          {s.name}
                        </Link>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{s.vendor_name}</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Add to watchlist">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.tagline}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{s.category_name}</Badge>
                      <Badge variant="outline">{s.pricing_tier}</Badge>
                      {s.verified && (
                        <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                      )}
                      {s.trial_available && (
                        <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Free trial</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">{Number(s.rating).toFixed(1)}</span>
                        <span>({s.review_count})</span>
                      </div>
                      <span className="text-sm font-medium">{s.starting_price}</span>
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
