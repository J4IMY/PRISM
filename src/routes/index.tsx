import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { query } from "@/lib/db";
import { WatchlistButton } from "@/components/watchlist-button";
import { useState, useEffect } from "react";

type SystemRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  pricing_tier: string;
  starting_price: string;
  verified: boolean;
  trial_available: boolean;
  rating: string;
  review_count: number;
  category_name: string;
  vendor_name: string;
  has_api: boolean;
  has_mobile_app: boolean;
  has_ai_features: boolean;
  deployment_type: string;
  target_size: string;
  security_certifications: string[];
};

type CategoryRow = { name: string; system_count: number };

type FilterValues = {
  category: string[];
  deployment: string[];
  size: string[];
  query: string;
};

const getSystems = createServerFn({ method: "GET" }).handler(async ({ data }: { data?: any }) => {
  const params: unknown[] = [];
  let paramIdx = 1;
  const conditions: string[] = ["s.status = 'active'"];

  const filters: FilterValues = {
    category: Array.isArray(data?.category) ? data.category : [],
    deployment: Array.isArray(data?.deployment) ? data.deployment : [],
    size: Array.isArray(data?.size) ? data.size : [],
    query: typeof data?.query === "string" ? data.query : "",
  };

  if (filters.category && filters.category.length > 0) {
    conditions.push(`c.name = ANY($${paramIdx++})`);
    params.push(filters.category);
  }

  if (filters.deployment && filters.deployment.length > 0) {
    const deploymentTypes = filters.deployment.map((d) => d.toLowerCase());
    conditions.push(`s.deployment_type = ANY($${paramIdx++})`);
    params.push(deploymentTypes);
  }

  if (filters.size && filters.size.length > 0) {
    conditions.push(`s.target_size = ANY($${paramIdx++})`);
    params.push(filters.size);
  }

  if (filters.query && filters.query.trim().length >= 2) {
    conditions.push(
      `(s.name ILIKE $${paramIdx++} OR s.tagline ILIKE $${paramIdx++} OR s.description ILIKE $${paramIdx++})`,
    );
    params.push(`%${filters.query}%`, `%${filters.query}%`, `%${filters.query}%`);
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  return query<SystemRow>(
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
      ${where}
      ORDER BY s.verified DESC, s.rating DESC, s.review_count DESC`,
    params,
  );
});

const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  return query<CategoryRow>(
    `SELECT c.name, COUNT(s.id)::int AS system_count
     FROM categories c
     LEFT JOIN systems s ON s.category_id = c.id AND s.status = 'active'
     GROUP BY c.id, c.name, c.sort_order
     ORDER BY c.sort_order`,
  );
});

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: Array.isArray(search.category) ? (search.category as string[]) : [],
    deployment: Array.isArray(search.deployment) ? (search.deployment as string[]) : [],
    size: Array.isArray(search.size) ? (search.size as string[]) : [],
    query: typeof search.query === "string" ? search.query : "",
  }),
  head: () => ({
    meta: [
      { title: "Discover enterprise software — PRISM" },
      {
        name: "description",
        content:
          "Search, filter, and compare enterprise software systems with verified vendor data and TCO calculators.",
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const [systems, categories] = await Promise.all([
      getSystems({ data: deps.search as any }),
      getCategories(),
    ]);
    return { systems, categories };
  },
  component: HomePage,
});

function HomePage() {
  const { systems, categories } = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    setSearchQuery(search.query ?? "");
  }, [search.query]);

  const handleFilterChange = (filterKey: keyof FilterValues, value: string) => {
    const current = search[filterKey];
    const currentArray = Array.isArray(current) ? current : [];
    const updated = currentArray.includes(value)
      ? currentArray.filter((v: string) => v !== value)
      : [...currentArray, value];
    void navigate({ search: { ...search, [filterKey]: updated } });
  };

  const handleSearch = () => {
    void navigate({ search: { ...search, query: searchQuery } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Discover the right software for your stack
          </h1>
          <p className="mt-2 text-muted-foreground">
            Compare pricing, features, and total cost of ownership across {systems.length} verified
            vendors.
          </p>
          <div className="mt-6 flex gap-2">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search CRM, ERP, helpdesk…"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            <FilterGroup
              title="Category"
              options={categories.map((c) => ({ name: c.name, count: c.system_count }))}
              filterKey="category"
              selected={search.category ?? []}
              onChange={handleFilterChange}
            />
            <FilterGroup
              title="Deployment"
              options={["Cloud", "On-prem", "Hybrid"].map((n) => ({ name: n, count: null }))}
              filterKey="deployment"
              selected={search.deployment ?? []}
              onChange={handleFilterChange}
            />
            <FilterGroup
              title="Company size"
              options={["SMB", "Mid", "Enterprise"].map((n) => ({ name: n, count: null }))}
              filterKey="size"
              selected={search.size ?? []}
              onChange={handleFilterChange}
            />
          </aside>

          <section className="flex-1 min-w-0">
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
                        <Link
                          to="/systems/$slug"
                          params={{ slug: s.slug }}
                          className="hover:underline"
                        >
                          {s.name}
                        </Link>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{s.vendor_name}</p>
                    </div>
                    <WatchlistButton systemId={s.id} user={user} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.tagline}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{s.category_name}</Badge>
                      <Badge variant="outline">{s.pricing_tier}</Badge>
                      {s.verified && (
                        <Badge className="gap-1">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                      {s.trial_available && (
                        <Badge variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" /> Free trial
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">
                          {Number(s.rating).toFixed(1)}
                        </span>
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

type FilterGroupProps = {
  title: string;
  options: { name: string; count: number | null }[];
  filterKey?: keyof FilterValues;
  selected?: string[];
  onChange?: (filterKey: keyof FilterValues, value: string) => void;
};

function FilterGroup({ title, options, filterKey, selected = [], onChange }: FilterGroupProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div className="space-y-2">
        {options.map((o) => (
          <div key={o.name} className="flex items-center gap-2">
            <Checkbox
              id={`${title}-${o.name}`}
              checked={selected.includes(o.name)}
              onCheckedChange={() => filterKey && onChange?.(filterKey, o.name)}
            />
            <Label
              htmlFor={`${title}-${o.name}`}
              className="text-sm font-normal text-muted-foreground flex-1"
            >
              <span className="flex-1">{o.name}</span>
              {o.count !== null && <span className="text-xs">({o.count})</span>}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
