import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useCallback, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Upload, Plus, Trash2, GripVertical, Star, X } from "lucide-react";
import { query, queryOne, transaction } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type SystemRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  verified: boolean;
  pricing_tier: string | null;
  starting_price: string | null;
  deployment_type: string | null;
  status: string;
  category_id: string | null;
  category_name: string | null;
};

type FeatureRow = {
  id: string;
  feature_name: string;
  feature_detail: string | null;
  category: string | null;
};

type MediaRow = {
  id: string;
  media_type: string;
  url: string;
  caption: string | null;
  sort_order: number;
};

type PricingPackageRow = {
  id: string;
  system_id: string;
  name: string;
  description: string | null;
  pricing_model: string;
  currency: string;
  base_price: number | null;
  billing_cadence: string | null;
  is_free: boolean;
  contact_sales: boolean;
  trial_available: boolean;
  trial_duration_days: number | null;
  minimum_seats: number | null;
  maximum_seats: number | null;
  is_unlimited_seats: boolean;
  is_popular: boolean;
  display_order: number;
  features?: string[];
};

type PackageFeatureRow = {
  id: string;
  package_id: string;
  feature_name: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type FeatureDraft = {
  key: string;
  feature_name: string;
  feature_detail: string;
  category: string;
};

type PricingPackageDraft = {
  id?: string;
  key: string;
  name: string;
  description: string;
  pricing_model: string;
  currency: string;
  base_price: string;
  billing_cadence: string;
  is_free: boolean;
  contact_sales: boolean;
  trial_available: boolean;
  trial_duration_days: string;
  minimum_seats: string;
  maximum_seats: string;
  is_unlimited_seats: boolean;
  is_popular: boolean;
  features: string[];
};

const PRICING_MODELS = [
  { value: "per_user", label: "Per User / Seat" },
  { value: "per_organization", label: "Per Organization" },
  { value: "per_device", label: "Per Device" },
  { value: "per_transaction", label: "Per Transaction" },
  { value: "usage_based", label: "Usage Based" },
  { value: "tiered_usage", label: "Tiered Usage" },
  { value: "monthly_subscription", label: "Monthly Subscription" },
  { value: "annual_subscription", label: "Annual Subscription" },
  { value: "one_time", label: "One-Time Purchase" },
  { value: "freemium", label: "Freemium" },
  { value: "free", label: "Free" },
  { value: "custom", label: "Custom Pricing" },
  { value: "contact_sales", label: "Contact Sales" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "KES", "ZAR", "NGN", "CAD", "AUD", "Other"];

const TRIAL_DURATIONS = [
  { value: "7", label: "7 Days" },
  { value: "14", label: "14 Days" },
  { value: "30", label: "30 Days" },
  { value: "60", label: "60 Days" },
  { value: "90", label: "90 Days" },
];

const COMMON_FEATURES = [
  "Inventory",
  "POS",
  "CRM",
  "Payroll",
  "HR",
  "Accounting",
  "API",
  "Analytics",
  "Multi-Branch",
  "Offline Mode",
  "Mobile App",
  "Custom Reports",
];

const cadenceModels = [
  "per_user",
  "per_organization",
  "usage_based",
  "monthly_subscription",
  "annual_subscription",
];
const cadencedModels = [
  "monthly_subscription",
  "annual_subscription",
  "per_user",
  "per_organization",
  "usage_based",
];

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "video/mp4"]);

const getSystemDetail = createServerFn({ method: "GET" }).handler(async ({ data }: any) => {
  const id = data?.id;
  if (!id) return null;
  const request = getRequest();
  const user = await getAuthUser(request);
  if (!user) return null;

  const system = await queryOne<SystemRow>(
    `SELECT
       s.id, s.name, s.slug, s.description,
       s.tagline, s.verified, s.pricing_tier,
       s.starting_price, s.deployment_type, s.status,
       s.category_id,
       c.name AS category_name
      FROM systems s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = $1 AND s.vendor_id = (
        SELECT vendor_id FROM vendor_members WHERE user_id = $2
      )`,
    [id, user.id],
  );
  if (!system) return null;

  const [features, media, categories, packages] = await Promise.all([
    query<FeatureRow>(
      `SELECT id, feature_name, feature_detail, category
         FROM system_features WHERE system_id = $1 ORDER BY category, feature_name`,
      [id],
    ),
    query<MediaRow>(
      `SELECT id, media_type, url, caption, sort_order
         FROM system_media WHERE system_id = $1 ORDER BY sort_order`,
      [id],
    ),
    query<CategoryOption>("SELECT id, name FROM categories ORDER BY sort_order, name"),
    query<PricingPackageRow>(
      `SELECT * FROM pricing_packages WHERE system_id = $1 ORDER BY display_order`,
      [id],
    ),
  ]);

  const packageFeatures = await query<PackageFeatureRow>(
    `SELECT pf.id, pf.package_id, pf.feature_name
       FROM package_features pf
       JOIN pricing_packages pp ON pp.id = pf.package_id
       WHERE pp.system_id = $1`,
    [id],
  );

  const featuresByPackage = packageFeatures.reduce<Record<string, string[]>>((acc, pf) => {
    if (!acc[pf.package_id]) acc[pf.package_id] = [];
    acc[pf.package_id].push(pf.feature_name);
    return acc;
  }, {});

  packages.forEach((p) => {
    p.features = featuresByPackage[p.id] || [];
  });

  return { system, features, media, categories, packages };
});

export const Route = createFileRoute("/vendor/systems/$id")({
  loader: async (args: any) => {
    const id = args.params?.id;
    if (!id) throw notFound();
    const detail = await (getSystemDetail as any)({ data: { id } });
    if (!detail) throw notFound();
    return detail;
  },
  component: VendorSystemEditPage,
});

function toFeatureDrafts(features: FeatureRow[]): FeatureDraft[] {
  return features.map((f) => ({
    key: f.id,
    feature_name: f.feature_name,
    feature_detail: f.feature_detail ?? "",
    category: f.category ?? "",
  }));
}

function VendorSystemEditPage() {
  const {
    system,
    features: initialFeatures,
    media: initialMedia,
    categories,
    packages: initialPackages,
  } = Route.useLoaderData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(system.name);
  const [tagline, setTagline] = useState(system.tagline ?? "");
  const [description, setDescription] = useState(system.description ?? "");
  const [categoryId, setCategoryId] = useState(system.category_id ?? "");
  const [status, setStatus] = useState(system.status);
  const [features, setFeatures] = useState<FeatureDraft[]>(() => toFeatureDrafts(initialFeatures));
  const [media, setMedia] = useState<MediaRow[]>(initialMedia);
  const [packages, setPackages] = useState<PricingPackageDraft[]>(() =>
    (initialPackages ?? []).map((p: PricingPackageRow) => ({
      id: p.id,
      key: p.id ?? crypto.randomUUID(),
      name: p.name ?? "",
      description: p.description ?? "",
      pricing_model: p.pricing_model ?? "per_user",
      currency: p.currency ?? "USD",
      base_price: p.base_price?.toString() ?? "",
      billing_cadence: p.billing_cadence ?? "monthly",
      is_free: p.is_free ?? false,
      contact_sales: p.contact_sales ?? false,
      trial_available: p.trial_available ?? false,
      trial_duration_days: p.trial_duration_days?.toString() ?? "",
      minimum_seats: p.minimum_seats?.toString() ?? "",
      maximum_seats: p.maximum_seats?.toString() ?? "",
      is_unlimited_seats: p.is_unlimited_seats ?? false,
      is_popular: p.is_popular ?? false,
      features: p.features ?? [],
    })),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [pricingError, setPricingError] = useState("");
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

  const syncFromResponse = useCallback(
    (data: {
      system?: {
        name?: string;
        tagline?: string | null;
        description?: string | null;
        category_id?: string | null;
        status?: string;
      };
      features?: FeatureRow[];
    }) => {
      if (data.system) {
        if (data.system.name !== undefined) setName(data.system.name);
        if (data.system.tagline !== undefined) setTagline(data.system.tagline ?? "");
        if (data.system.description !== undefined) setDescription(data.system.description ?? "");
        if (data.system.category_id !== undefined) setCategoryId(data.system.category_id ?? "");
        if (data.system.status !== undefined) setStatus(data.system.status);
      }
      if (data.features) {
        setFeatures(toFeatureDrafts(data.features));
      }
    },
    [],
  );

  const buildPayload = (nextStatus: "draft" | "active") => ({
    name: name.trim(),
    tagline: tagline.trim() || null,
    description: description.trim() || null,
    category_id: categoryId || null,
    status: nextStatus,
    features: features
      .filter((f) => f.feature_name.trim())
      .map((f) => ({
        feature_name: f.feature_name.trim(),
        feature_detail: f.feature_detail.trim() || null,
        category: f.category.trim() || null,
        feature_value: true,
      })),
    pricing_packages: packages.map((p) => ({
      id: p.id,
      name: p.name.trim(),
      description: p.description.trim() || null,
      pricing_model: p.pricing_model,
      currency: p.currency,
      base_price: p.is_free || p.contact_sales ? null : parseFloat(p.base_price) || 0,
      billing_cadence: cadencedModels.includes(p.pricing_model) ? p.billing_cadence : null,
      is_free: p.is_free,
      contact_sales: p.contact_sales,
      trial_available: p.trial_available,
      trial_duration_days: p.trial_available ? parseInt(p.trial_duration_days) || null : null,
      minimum_seats:
        p.pricing_model === "per_user" && !p.is_unlimited_seats
          ? parseInt(p.minimum_seats) || null
          : null,
      maximum_seats:
        p.pricing_model === "per_user" && !p.is_unlimited_seats
          ? parseInt(p.maximum_seats) || null
          : null,
      is_unlimited_seats: p.is_unlimited_seats,
      is_popular: p.is_popular,
    })),
  });

  const handleSave = async (nextStatus: "draft" | "active") => {
    if (!name.trim() || saving) return;

    if (packages.some((p) => !p.name.trim() || !p.pricing_model)) {
      setPricingError("All packages must have a name and pricing model selected.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setPricingError("");

    try {
      const res = await fetch(`/api/vendor-systems/${system.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPayload(nextStatus)),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        system?: {
          name: string;
          tagline: string | null;
          description: string | null;
          category_id: string | null;
          status: string;
        };
        features?: FeatureRow[];
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to save system");

      syncFromResponse(data);
      setStatus(nextStatus);
      setSuccess(nextStatus === "active" ? "System published." : "Draft saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save system");
    } finally {
      setSaving(false);
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setMediaError("");
    setUploading(true);

    try {
      for (const file of fileList) {
        if (!ACCEPTED_MEDIA_TYPES.has(file.type)) {
          throw new Error("Only PNG, JPG, and MP4 files are supported.");
        }
        if (file.size > MAX_MEDIA_BYTES) {
          throw new Error("Each file must be 50 MB or smaller.");
        }

        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Failed to read file."));
          };
          reader.onerror = () => reject(new Error("Failed to read file."));
          reader.readAsDataURL(file);
        });

        const mediaType = file.type.startsWith("video/") ? "video" : "screenshot";
        const res = await fetch(`/api/vendor-systems/${system.id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url, media_type: mediaType }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          media?: MediaRow;
        };
        if (!res.ok) throw new Error(data.error ?? "Failed to upload media");
        if (data.media) {
          setMedia((prev) => [...prev, data.media!]);
        }
      }
    } catch (e) {
      setMediaError(e instanceof Error ? e.message : "Failed to upload media");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMediaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) void uploadFiles(e.dataTransfer.files);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    setMediaError("");
    try {
      const res = await fetch(`/api/vendor-systems/${system.id}/media/${mediaId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete media");
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (e) {
      setMediaError(e instanceof Error ? e.message : "Failed to delete media");
    }
  };

  const addFeature = () => {
    setFeatures((prev) => [
      ...prev,
      { key: crypto.randomUUID(), feature_name: "", feature_detail: "", category: "" },
    ]);
  };

  const updateFeature = (key: string, field: keyof Omit<FeatureDraft, "key">, value: string) => {
    setFeatures((prev) => prev.map((f) => (f.key === key ? { ...f, [field]: value } : f)));
  };

  const removeFeature = (key: string) => {
    setFeatures((prev) => prev.filter((f) => f.key !== key));
  };

  const addPackage = () => {
    setPackages((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        name: "",
        description: "",
        pricing_model: "per_user",
        currency: "USD",
        base_price: "",
        billing_cadence: "monthly",
        is_free: false,
        contact_sales: false,
        trial_available: false,
        trial_duration_days: "",
        minimum_seats: "",
        maximum_seats: "",
        is_unlimited_seats: false,
        is_popular: false,
        features: [],
      },
    ]);
  };

  const updatePackage = (
    key: string,
    field: keyof Omit<PricingPackageDraft, "key" | "id">,
    value: string | boolean | string[],
  ) => {
    setPackages((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
  };

  const removePackage = (key: string) => {
    if (packages.length <= 1) return;
    setPackages((prev) => prev.filter((p) => p.key !== key));
  };

  const movePackage = (fromIndex: number, toIndex: number) => {
    setPackages((prev) => {
      const newPackages = [...prev];
      const [item] = newPackages.splice(fromIndex, 1);
      newPackages.splice(toIndex, 0, item);
      return newPackages;
    });
  };

  const togglePopular = (key: string) => {
    setPackages((prev) =>
      prev.map((p) => ({ ...p, is_popular: p.key === key ? !p.is_popular : false })),
    );
  };

  const handleFeatureToggle = (packageKey: string, featureName: string) => {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.key !== packageKey) return p;
        const features = p.features.includes(featureName)
          ? p.features.filter((f) => f !== featureName)
          : [...p.features, featureName];
        return { ...p, features };
      }),
    );
  };

  const addCustomFeature = (packageKey: string, customFeature: string) => {
    if (!customFeature.trim()) return;
    setPackages((prev) =>
      prev.map((p) => {
        if (p.key !== packageKey) return p;
        const feature = customFeature.trim();
        if (p.features.includes(feature)) return p;
        return { ...p, features: [...p.features, feature] };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <Link
        to="/vendor/systems"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to systems
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{name || system.name}</h1>
            <Badge
              variant={
                status === "active" ? "default" : status === "draft" ? "secondary" : "outline"
              }
            >
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Edit listing details</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => handleSave("draft")}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => handleSave("active")}>
            {saving ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}
      {pricingError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {pricingError}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="system-name">Name</Label>
                <Input id="system-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="system-category">Category</Label>
                <select
                  id="system-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select category…</option>
                  {categories.map((c: CategoryOption) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="system-tagline">Tagline</Label>
                <Input
                  id="system-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="system-description">Description</Label>
                <Textarea
                  id="system-description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="space-y-4">
            {packages.map((pkg, index) => {
              const showCadence = cadencedModels.includes(pkg.pricing_model);
              const showSeatLimits = pkg.pricing_model === "per_user";
              const showPriceCurrency = !pkg.is_free && !pkg.contact_sales;
              const isExpanded = expandedPackage === pkg.key;

              return (
                <Card key={pkg.key} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <CardTitle className="text-base">
                          Package {index + 1}: {pkg.name || "Untitled"}
                        </CardTitle>
                        {pkg.is_popular && (
                          <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
                            <Star className="h-3 w-3 fill-amber-500" /> Popular
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedPackage(isExpanded ? null : pkg.key)}
                        >
                          {isExpanded ? "Collapse" : "Expand"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePackage(pkg.key)}
                          disabled={packages.length <= 1}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label>Package Name *</Label>
                          <Input
                            value={pkg.name}
                            onChange={(e) => updatePackage(pkg.key, "name", e.target.value)}
                            placeholder="Starter"
                          />
                        </div>
                        <div>
                          <Label>Short Description (120 chars)</Label>
                          <Input
                            value={pkg.description}
                            onChange={(e) => updatePackage(pkg.key, "description", e.target.value)}
                            placeholder="Perfect for startups"
                            maxLength={120}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Button
                            type="button"
                            variant={pkg.is_popular ? "default" : "outline"}
                            size="sm"
                            onClick={() => togglePopular(pkg.key)}
                            className="gap-1"
                          >
                            <Star className="h-3 w-3" /> Most Popular
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        <div>
                          <Label>Pricing Model *</Label>
                          <Select
                            value={pkg.pricing_model}
                            onValueChange={(v) => updatePackage(pkg.key, "pricing_model", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICING_MODELS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {showPriceCurrency && (
                          <>
                            <div>
                              <Label>Currency</Label>
                              <Select
                                value={pkg.currency}
                                onValueChange={(v) => updatePackage(pkg.key, "currency", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Base Price</Label>
                              <Input
                                type="number"
                                value={pkg.base_price}
                                onChange={(e) =>
                                  updatePackage(pkg.key, "base_price", e.target.value)
                                }
                                placeholder="15"
                              />
                            </div>
                          </>
                        )}

                        {showCadence && (
                          <div>
                            <Label>Billing Cadence</Label>
                            <Select
                              value={pkg.billing_cadence}
                              onValueChange={(v) => updatePackage(pkg.key, "billing_cadence", v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="annual">Annual</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-6">
                          <Checkbox
                            id={`free-${pkg.key}`}
                            checked={pkg.is_free}
                            onCheckedChange={(v) => updatePackage(pkg.key, "is_free", !!v)}
                          />
                          <Label htmlFor={`free-${pkg.key}`} className="text-sm">
                            Free Plan
                          </Label>
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                          <Checkbox
                            id={`contact-sales-${pkg.key}`}
                            checked={pkg.contact_sales}
                            onCheckedChange={(v) => updatePackage(pkg.key, "contact_sales", !!v)}
                          />
                          <Label htmlFor={`contact-sales-${pkg.key}`} className="text-sm">
                            Contact Sales
                          </Label>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`trial-${pkg.key}`}
                            checked={pkg.trial_available}
                            onCheckedChange={(v) => updatePackage(pkg.key, "trial_available", !!v)}
                          />
                          <Label htmlFor={`trial-${pkg.key}`} className="text-sm">
                            Free Trial
                          </Label>
                        </div>

                        {pkg.trial_available && (
                          <div>
                            <Label>Trial Duration</Label>
                            <Select
                              value={pkg.trial_duration_days}
                              onValueChange={(v) =>
                                updatePackage(pkg.key, "trial_duration_days", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TRIAL_DURATIONS.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {showSeatLimits && !pkg.is_unlimited_seats && (
                          <>
                            <div>
                              <Label>Min Seats</Label>
                              <Input
                                type="number"
                                value={pkg.minimum_seats}
                                onChange={(e) =>
                                  updatePackage(pkg.key, "minimum_seats", e.target.value)
                                }
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <Label>Max Seats</Label>
                              <Input
                                type="number"
                                value={pkg.maximum_seats}
                                onChange={(e) =>
                                  updatePackage(pkg.key, "maximum_seats", e.target.value)
                                }
                                placeholder="25"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <Checkbox
                                id={`unlimited-${pkg.key}`}
                                checked={pkg.is_unlimited_seats}
                                onCheckedChange={(v) =>
                                  updatePackage(pkg.key, "is_unlimited_seats", !!v)
                                }
                              />
                              <Label htmlFor={`unlimited-${pkg.key}`} className="text-sm">
                                Unlimited
                              </Label>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Included Features</Label>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_FEATURES.map((f) => (
                            <Badge
                              key={f}
                              variant={pkg.features.includes(f) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => handleFeatureToggle(pkg.key, f)}
                            >
                              {pkg.features.includes(f) && (
                                <X className="h-3 w-3 mr-1 inline-block" />
                              )}
                              {f}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Add custom feature..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addCustomFeature(pkg.key, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector(
                                `input[placeholder="Add custom feature..."]`,
                              ) as HTMLInputElement;
                              addCustomFeature(pkg.key, input.value);
                              input.value = "";
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
            <Button variant="outline" className="gap-2" onClick={addPackage}>
              <Plus className="h-4 w-4" />
              Add Package
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardContent className="pt-6 space-y-3">
              {features.length === 0 && (
                <p className="text-sm text-muted-foreground">No features yet. Add one below.</p>
              )}
              {features.map((f) => (
                <div
                  key={f.key}
                  className="flex flex-col gap-3 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start"
                >
                  <div className="flex-1 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`feature-name-${f.key}`}>Feature name</Label>
                      <Input
                        id={`feature-name-${f.key}`}
                        value={f.feature_name}
                        onChange={(e) => updateFeature(f.key, "feature_name", e.target.value)}
                        placeholder="Single sign-on"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`feature-category-${f.key}`}>Group</Label>
                      <Input
                        id={`feature-category-${f.key}`}
                        value={f.category}
                        onChange={(e) => updateFeature(f.key, "category", e.target.value)}
                        placeholder="Security"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor={`feature-detail-${f.key}`}>Detail</Label>
                      <Input
                        id={`feature-detail-${f.key}`}
                        value={f.feature_detail}
                        onChange={(e) => updateFeature(f.key, "feature_detail", e.target.value)}
                        placeholder="Available on Growth and Enterprise"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeFeature(f.key)}
                    aria-label="Remove feature"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="gap-2" onClick={addFeature}>
                <Plus className="h-4 w-4" />
                Add feature
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardContent className="pt-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,video/mp4"
                multiple
                className="hidden"
                onChange={handleMediaInputChange}
              />
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <Upload className="mx-auto h-8 w-8 mb-2" />
                <p>{uploading ? "Uploading…" : "Drag & drop screenshots or click to upload"}</p>
                <p className="text-xs mt-1">PNG, JPG, MP4 up to 50 MB</p>
              </div>
              {mediaError && <p className="mt-3 text-sm text-red-600">{mediaError}</p>}
              {media.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-4 mt-4">
                  {media.map((m) => (
                    <div
                      key={m.id}
                      className="relative group aspect-video rounded-md bg-secondary overflow-hidden"
                    >
                      {m.media_type === "video" ? (
                        <video src={m.url} className="h-full w-full object-cover" controls />
                      ) : (
                        <img src={m.url} alt="" className="h-full w-full object-cover" />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteMedia(m.id);
                        }}
                        aria-label="Delete media"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {["Website", "Documentation", "YouTube demo", "LinkedIn"].map((l) => (
                <div key={l}>
                  <Label>{l}</Label>
                  <Input placeholder={`https://...`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardContent className="pt-6 grid gap-4">
              <div>
                <Label>Slug</Label>
                <Input defaultValue={system.slug} />
              </div>
              <div>
                <Label>Meta title</Label>
                <Input defaultValue={system.name} />
              </div>
              <div>
                <Label>Meta description</Label>
                <Textarea rows={3} defaultValue={system.tagline ?? ""} />
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">SEO score: 82</Badge>
                <Badge variant="secondary">Indexed</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
