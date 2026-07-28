import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Sparkles, Check, Minus } from "lucide-react";
import { query } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { requireRoles } from "@/lib/route-guards";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getWatchlist = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const user = await getAuthUser(request);
  if (!user) return [];

  return query(
    `SELECT
       w.id AS watchlist_id,
       s.id, s.name, s.slug, s.description, s.tagline,
       (v.id IS NOT NULL) AS verified,
       COALESCE(BOOL_OR(p.trial_available), s.trial_available, false) AS trial_available,
       s.pricing_tier, s.starting_price,
       c.name AS category_name,
       v.company_name AS vendor_name
     FROM watchlist w
     JOIN systems s ON s.id = w.system_id
     LEFT JOIN categories c ON s.category_id = c.id
     LEFT JOIN vendors v ON s.vendor_id = v.id
     LEFT JOIN pricing_packages p ON p.system_id = s.id
     WHERE w.user_id = $1 AND s.status = 'active'
     GROUP BY w.id, s.id, c.name, v.id, v.company_name
     ORDER BY w.created_at DESC`,
    [user.id],
  );
});

type CompareRow = {
  label: string;
  getValue: (system: CompareSystem) => React.ReactNode;
};

type CompareSystem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  deployment_type: string | null;
  pricing_tier: string | null;
  starting_price: string | null;
  verified: boolean;
  trial_available: boolean;
  has_api: boolean;
  has_mobile_app: boolean;
  has_ai_features: boolean;
  category_name: string | null;
  vendor_name: string | null;
  reviews: Array<{
    rating: number;
    title: string | null;
    pros: string | null;
    cons: string | null;
    review_text: string | null;
    is_verified_customer: boolean;
    created_at: string;
  }>;
  packages: Array<{
    id: string;
    name: string;
    description: string | null;
    pricing_model: string;
    currency: string;
    base_price: number | null;
    billing_cadence: string | null;
    trial_available: boolean;
    features: string[];
  }>;
  features: Array<{
    feature_name: string;
    feature_value: boolean;
    feature_detail: string | null;
    category: string | null;
  }>;
};

const COMPARE_ROWS: CompareRow[] = [
  {
    label: "Vendor",
    getValue: (s: CompareSystem) => s.vendor_name || "—",
  },
  {
    label: "Category",
    getValue: (s: CompareSystem) => s.category_name || "—",
  },
  {
    label: "Pricing tier",
    getValue: (s: CompareSystem) => s.pricing_tier || "—",
  },
  {
    label: "Deployment",
    getValue: (s: CompareSystem) => s.deployment_type || "—",
  },
  {
    label: "Starting price",
    getValue: (s: CompareSystem) => s.starting_price || "—",
  },
  {
    label: "Free trial",
    getValue: (s: CompareSystem) =>
      s.trial_available ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground" />
      ),
  },
  {
    label: "Verified",
    getValue: (s: CompareSystem) =>
      s.verified ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground" />
      ),
  },
  {
    label: "API",
    getValue: (s: CompareSystem) =>
      s.has_api ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground" />
      ),
  },
  {
    label: "Mobile app",
    getValue: (s: CompareSystem) =>
      s.has_mobile_app ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground" />
      ),
  },
  {
    label: "AI features",
    getValue: (s: CompareSystem) =>
      s.has_ai_features ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground" />
      ),
  },
  {
    label: "Avg. review",
    getValue: (s: CompareSystem) => {
      const reviews = s.reviews || [];
      if (!reviews.length) return "—";
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return `${avg.toFixed(1)} / 5 (${reviews.length})`;
    },
  },
  {
    label: "Pricing models",
    getValue: (s: CompareSystem) => {
      const pkgs = s.packages || [];
      if (!pkgs.length) return "—";
      const models = pkgs.map((p) => p.pricing_model).filter(Boolean);
      return [...new Set(models)].join(", ") || "—";
    },
  },
  {
    label: "Top features",
    getValue: (s: CompareSystem) => {
      const feats = s.features || [];
      const names = feats
        .slice(0, 5)
        .map((f) => f.feature_name)
        .filter(Boolean);
      return names.length ? names.join(", ") : "—";
    },
  },
];

export const Route = createFileRoute("/watchlist")({
  beforeLoad: ({ context }) => {
    requireRoles(context.user, ["user", "vendor", "moderator", "admin"]);
  },
  loader: async () => ({ items: await getWatchlist() }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const initialItems = Route.useLoaderData();
  const [items, setItems] = useState(initialItems.items);
  const { user } = Route.useRouteContext();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSystems, setCompareSystems] = useState<CompareSystem[]>([]);
  const [comparing, setComparing] = useState(false);

  const handleRemove = async (watchlistId: string, systemId: string) => {
    const res = await fetch(`/api/watchlist/${systemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setItems((prev) =>
        prev.filter((item: Record<string, unknown>) => item.watchlist_id !== watchlistId),
      );
      setSelectedIds((prev) => prev.filter((id) => id !== systemId));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setComparing(true);
    try {
      const res = await fetch("/api/watchlist/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ system_ids: selectedIds }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        systems?: CompareSystem[];
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load comparison");
      setCompareSystems(data.systems ?? []);
      setCompareOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to compare systems");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Watchlist</h1>
          {selectedIds.length >= 2 && (
            <Button onClick={handleCompare} disabled={comparing}>
              {comparing ? "Loading…" : `Compare (${selectedIds.length})`}
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-muted-foreground">
            No saved systems yet. Browse discover to add some.
          </p>
        ) : (
          <div className="grid gap-4">
            {items.map((item: Record<string, unknown>) => {
              const id = item.id as string;
              const checked = selectedIds.includes(id);
              return (
                <Card key={id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(id)}
                        className="h-4 w-4 rounded border-gray-300"
                        disabled={selectedIds.length >= 3 && !checked}
                      />
                      <div>
                        <Link
                          to="/systems/$slug"
                          params={{ slug: item.slug as string }}
                          className="font-medium hover:underline"
                        >
                          {item.name as string}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {item.vendor_name as string} · {item.category_name as string}
                        </p>
                        {(item.verified as boolean) && (
                          <Badge variant="secondary" className="mt-1">
                            Verified
                          </Badge>
                        )}
                        {(item.trial_available as boolean) && (
                          <Badge variant="outline" className="gap-1 mt-1">
                            <Sparkles className="h-3 w-3" />
                            Free trial
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.starting_price as string}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        onClick={() => handleRemove(item.watchlist_id as string, id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare systems</DialogTitle>
            <DialogDescription>Side-by-side comparison of selected systems</DialogDescription>
          </DialogHeader>
          {compareSystems.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Attribute</TableHead>
                    {compareSystems.map((s) => (
                      <TableHead key={s.id} className="text-left">
                        {s.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARE_ROWS.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium text-muted-foreground">
                        {row.label}
                      </TableCell>
                      {compareSystems.map((s) => (
                        <TableCell key={s.id}>{row.getValue(s)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
