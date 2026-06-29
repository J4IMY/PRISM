import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useCallback, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Upload, Plus, Trash2 } from "lucide-react";
import { query, queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

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

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "video/mp4",
]);

const getSystemDetail = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { id: string } }) => {
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
      [data.id, user.id],
    );
    if (!system) return null;

    const [features, media, categories] = await Promise.all([
      query<FeatureRow>(
        `SELECT id, feature_name, feature_detail, category
         FROM system_features WHERE system_id = $1 ORDER BY category, feature_name`,
        [data.id],
      ),
      query<MediaRow>(
        `SELECT id, media_type, url, caption, sort_order
         FROM system_media WHERE system_id = $1 ORDER BY sort_order`,
        [data.id],
      ),
      query<CategoryOption>(
        "SELECT id, name FROM categories ORDER BY sort_order, name",
      ),
    ]);

    return { system, features, media, categories };
  },
);

export const Route = createFileRoute("/vendor/systems/$id")({
  loader: async ({ params }) => {
    const detail = await getSystemDetail({ data: { id: params.id } });
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
  const { system, features: initialFeatures, media: initialMedia, categories } =
    Route.useLoaderData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(system.name);
  const [tagline, setTagline] = useState(system.tagline ?? "");
  const [description, setDescription] = useState(system.description ?? "");
  const [categoryId, setCategoryId] = useState(system.category_id ?? "");
  const [status, setStatus] = useState(system.status);
  const [features, setFeatures] = useState<FeatureDraft[]>(() => toFeatureDrafts(initialFeatures));
  const [media, setMedia] = useState<MediaRow[]>(initialMedia);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mediaError, setMediaError] = useState("");

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
  });

  const handleSave = async (nextStatus: "draft" | "active") => {
    if (!name.trim() || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

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
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [field]: value } : f)),
    );
  };

  const removeFeature = (key: string) => {
    setFeatures((prev) => prev.filter((f) => f.key !== key));
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
                <Input
                  id="system-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
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
                  {categories.map((c) => (
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
          <div className="space-y-3">
            {["Starter", "Growth", "Enterprise"].map((p) => (
              <Card key={p}>
                <CardContent className="pt-6 grid gap-4 sm:grid-cols-4 items-end">
                  <div>
                    <Label>Package</Label>
                    <Input defaultValue={p} />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <select className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>Per-seat</option>
                      <option>Flat</option>
                      <option>Per-usage</option>
                      <option>Tiered</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <Label>Base price</Label>
                    <Input type="number" defaultValue={15} />
                  </div>
                  <div>
                    <Label>Cadence</Label>
                    <select className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>Monthly</option>
                      <option>Annual</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add package
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
                    <div key={m.id} className="relative group aspect-video rounded-md bg-secondary overflow-hidden">
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
