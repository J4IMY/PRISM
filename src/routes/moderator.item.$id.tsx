import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Plus, X } from "lucide-react";
import { queryOne } from "@/lib/db";
import { ScraperActions } from "@/components/scraper-actions";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useState } from "react";

const getScraperItem = createServerFn({ method: "GET" }).handler(async ({ data }: any) => {
  const id = data?.id;
  if (!id) return null;
  const item = await queryOne<{
    id: string;
    name: string;
    source: string;
    confidence: number;
    age_days: number;
    status: string;
    payload: Record<string, unknown>;
  }>(
    `SELECT id, name, source, confidence, age_days, status, payload
     FROM scraper_items
     WHERE id = $1`,
    [id],
  );
  return item;
});

export const Route = createFileRoute("/moderator/item/$id")({
  loader: async (args: any) => {
    const id = args.params?.id;
    if (!id) throw notFound();
    const item = await (getScraperItem as any)({ data: { id } });
    if (!item) throw notFound();
    return { item };
  },
  component: ModeratorItemPage,
});

type PricingPlan = {
  name: string;
  description?: string | null;
  pricing_model: string;
  currency: string;
  base_price: number | null;
  billing_cadence?: string | null;
  is_free: boolean;
  contact_sales: boolean;
  trial_available: boolean;
  trial_duration_days?: number | null;
  minimum_seats?: number | null;
  maximum_seats?: number | null;
  is_unlimited_seats: boolean;
  is_popular: boolean;
  features: string[];
};

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ModeratorItemPage() {
  const { item } = Route.useLoaderData();
  const router = useRouter();
  const payload = item.payload ?? {};
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(String(payload.description ?? ""));
  const [startingPrice, setStartingPrice] = useState(String(payload.starting_price ?? ""));
  const [pricingTier, setPricingTier] = useState(String(payload.pricing_tier ?? ""));
  const [plans, setPlans] = useState<PricingPlan[]>(() => {
    const raw = payload.plans;
    if (Array.isArray(raw)) {
      return raw.map((plan) => {
        if (typeof plan === "string") {
          return {
            name: plan,
            description: null,
            pricing_model: "custom",
            currency: "USD",
            base_price: null,
            billing_cadence: null,
            is_free: false,
            contact_sales: false,
            trial_available: false,
            trial_duration_days: null,
            minimum_seats: null,
            maximum_seats: null,
            is_unlimited_seats: false,
            is_popular: false,
            features: [],
          };
        }
        return {
          ...plan,
          features: Array.isArray(plan.features) ? plan.features : [],
        } as PricingPlan;
      });
    }
    return [];
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/scraper/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description,
          starting_price: startingPrice,
          pricing_tier: pricingTier,
          plans,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; item?: unknown };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Changes saved");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (index: number, patch: Partial<PricingPlan>) => {
    setPlans((prev) => prev.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)));
  };

  const removePlan = (index: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const addPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        name: "New Plan",
        description: null,
        pricing_model: "custom",
        currency: "USD",
        base_price: null,
        billing_cadence: null,
        is_free: false,
        contact_sales: false,
        trial_available: false,
        trial_duration_days: null,
        minimum_seats: null,
        maximum_seats: null,
        is_unlimited_seats: false,
        is_popular: false,
        features: [],
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-3xl">
        <Link
          to="/moderator/cleaning-queue"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to cleaning queue
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="name">System name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              From {item.source} · confidence {Math.round(item.confidence * 100)}%
            </p>
          </div>
          <Badge variant="outline">{item.status}</Badge>
        </header>

        <Separator />

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pricing tier</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={pricingTier}
                  onChange={(e) => setPricingTier(e.target.value)}
                  placeholder="e.g. starter, professional, enterprise"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Starting price</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  placeholder="e.g. $29/mo"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pricing packages</CardTitle>
              <Button size="sm" variant="outline" onClick={addPlan}>
                Add package
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages yet. Add one above.</p>
              ) : (
                plans.map((plan, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Package {index + 1}</Label>
                      <Button size="sm" variant="ghost" onClick={() => removePlan(index)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={plan.name}
                          onChange={(e) => updatePlan(index, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Select
                          value={plan.base_price?.toString() ?? "contact"}
                          onValueChange={(value) =>
                            updatePlan(index, {
                              base_price: value === "contact" ? null : parseFloat(value),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select price" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contact">Contact Sales</SelectItem>
                            <SelectItem value="0">Free</SelectItem>
                            <SelectItem value="9">$9/mo</SelectItem>
                            <SelectItem value="19">$19/mo</SelectItem>
                            <SelectItem value="29">$29/mo</SelectItem>
                            <SelectItem value="49">$49/mo</SelectItem>
                            <SelectItem value="99">$99/mo</SelectItem>
                            <SelectItem value="199">$199/mo</SelectItem>
                            <SelectItem value="299">$299/mo</SelectItem>
                            <SelectItem value="499">$499/mo</SelectItem>
                            <SelectItem value="999">$999/mo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Currency</Label>
                        <Select
                          value={plan.currency}
                          onValueChange={(value) => updatePlan(index, { currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="KES">KES (KSh)</SelectItem>
                            <SelectItem value="ZAR">ZAR (R)</SelectItem>
                            <SelectItem value="NGN">NGN (₦)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Billing cadence</Label>
                        <Select
                          value={plan.billing_cadence ?? "unspecified"}
                          onValueChange={(value) =>
                            updatePlan(index, {
                              billing_cadence: value === "unspecified" ? null : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                            <SelectItem value="unspecified">Not specified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={plan.description ?? ""}
                        onChange={(e) => updatePlan(index, { description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Features</Label>
                      <div className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...plan.features];
                                newFeatures[featureIndex] = e.target.value;
                                updatePlan(index, { features: newFeatures });
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newFeatures = plan.features.filter(
                                  (_, i) => i !== featureIndex,
                                );
                                updatePlan(index, { features: newFeatures });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newFeatures = [...plan.features, ""];
                            updatePlan(index, { features: newFeatures });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add feature
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 justify-end">
          <ScraperActions
            itemId={item.id}
            status={item.status}
            layout="stacked"
            onDeleted={() => router.navigate({ to: "/moderator/cleaning-queue" })}
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </main>
    </div>
  );
}
