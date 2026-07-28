import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Check,
  Minus,
  Star,
  Clock,
  Sparkles,
  Building2,
  Users,
  Calendar,
  MapPin,
  Globe,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { query, queryOne } from "@/lib/db";
import { WatchlistButton } from "@/components/watchlist-button";
import { SystemTcoCalculator, type TcoPackage } from "@/components/system-tco-calculator";

type Review = {
  rating: number;
  title: string | null;
  pros: string | null;
  cons: string | null;
  review_text: string | null;
  is_verified_customer: boolean;
  created_at: string;
};

type VendorInfo = {
  id: string;
  company_name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  verification_status: string;
  industry: string | null;
  company_size: string | null;
  founded_date: string | null;
  location: string | null;
  location_label: string | null;
  social_links: Record<string, unknown>;
};

type Technology = {
  id: string;
  name: string;
  color: string;
};

type Contact = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar_url: string | null;
};

const getSystem = createServerFn({ method: "GET" }).handler(async ({ data }: any) => {
  const slug = data?.slug;
  if (!slug) return null;
  const system = await queryOne<any>(
    `SELECT
       s.id, s.name, s.slug, s.tagline, s.description,
       s.deployment_type, s.pricing_tier, s.starting_price,
       s.verified, s.trial_available, s.has_api, s.has_mobile_app,
       s.has_ai_features, s.has_offline_mode, s.security_certifications,
       c.name AS category_name,
       v.id AS vendor_id, v.company_name AS vendor_name, v.slug AS vendor_slug,
       v.description AS vendor_description, v.website AS vendor_website,
       v.logo_url AS vendor_logo, v.verification_status,
        v.industry, v.company_size, v.founded_date, v.location, v.location_label,
        v.social_links
     FROM systems s
     LEFT JOIN categories c ON s.category_id = c.id
     LEFT JOIN vendors v ON s.vendor_id = v.id
     WHERE s.slug = $1 AND s.status = 'active'`,
    [slug],
  );
  if (!system) return null;

  const [media, packages, reviews, technologies, contacts] = await Promise.all([
    query<{ id: string; media_type: string; url: string; caption: string | null }>(
      "SELECT id, media_type, url, caption FROM system_media WHERE system_id = $1 ORDER BY sort_order",
      [system.id],
    ),
    query<TcoPackage>(
      `SELECT p.id, p.name, p.description, p.pricing_model, p.currency, p.base_price,
              p.billing_cadence, p.is_free, p.contact_sales, p.trial_available,
              p.trial_duration_days, p.minimum_seats, p.maximum_seats, p.is_unlimited_seats, p.is_popular,
              COALESCE(json_agg(pf.feature_name) FILTER (WHERE pf.feature_name IS NOT NULL), '[]') as features
       FROM pricing_packages p
       LEFT JOIN package_features pf ON pf.package_id = p.id
       WHERE p.system_id = $1
       GROUP BY p.id
       ORDER BY p.display_order`,
      [system.id],
    ),
    query<Review>(
      `SELECT r.rating, r.title, r.pros, r.cons, r.review_text,
              r.is_verified_customer, r.created_at
       FROM reviews r
       WHERE r.system_id = $1 AND r.admin_status = 'approved'
       ORDER BY r.created_at DESC`,
      [system.id],
    ),
    query<Technology>(
      `SELECT id, name, color FROM technologies WHERE vendor_id = $1 ORDER BY name`,
      [system.vendor_id],
    ),
    query<Contact>(
      `SELECT id, name, role, email, avatar_url FROM contacts WHERE vendor_id = $1 ORDER BY name`,
      [system.vendor_id],
    ),
  ]);

  return {
    system,
    media,
    packages,
    reviews,
    vendor: system
      ? {
          id: system.vendor_id,
          company_name: system.vendor_name,
          slug: system.vendor_slug,
          description: system.vendor_description,
          website: system.vendor_website,
          logo_url: system.vendor_logo,
          verification_status: system.verification_status,
          industry: system.industry,
          company_size: system.company_size,
          founded_date: system.founded_date,
          location: system.location,
          location_label: system.location_label,
          social_links: system.social_links || {},
        }
      : null,
    technologies,
    contacts,
  };
});

export const Route = createFileRoute("/systems/$slug")({
  loader: async (args: any) => {
    const slug = args.params?.slug;
    if (!slug) throw notFound();
    const data = await (getSystem as any)({ data: { slug } });
    if (!data) throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <h1 className="text-2xl font-semibold">System not found</h1>
    </div>
  ),
  component: SystemDetailPage,
});

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SYSTEM_ICON_MAP: Record<string, string> = {
  crm: "simple-icons:salesforce",
  salesforce: "simple-icons:salesforce",
  hubspot: "simple-icons:hubspot",
  zoho: "simple-icons:zoho",
  erp: "mdi:database",
  helpdesk: "mdi:headset",
  support: "mdi:headset",
  zendesk: "simple-icons:zendesk",
  hr: "mdi:account-heart",
  hris: "mdi:account-heart",
  payroll: "mdi:cash",
  finance: "mdi:finance",
  accounting: "mdi:calculator",
  marketing: "mdi:bullhorn",
  project: "mdi:clipboard-list",
  management: "mdi:clipboard-list",
  communication: "mdi:message-text",
  chat: "mdi:message-text",
  cloud: "mdi:cloud",
  security: "mdi:shield-lock",
  devops: "mdi:dev-to",
  analytics: "mdi:chart-line",
  ecommerce: "mdi:shopping",
  shopify: "simple-icons:shopify",
  inventory: "mdi:package-variant-closed",
  cms: "mdi:wordpress",
  wordpress: "simple-icons:wordpress",
  integration: "mdi:api",
  api: "mdi:api",
};

function getSystemIcon(name: string, storedIcon?: string | null): string {
  if (storedIcon) return storedIcon;
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const words = normalized.split(" ");
  for (const w of words) {
    if (SYSTEM_ICON_MAP[w]) return SYSTEM_ICON_MAP[w];
  }
  return "mdi:application";
}

const TECH_ICON_MAP: Record<string, string> = {
  postgresql: "simple-icons:postgresql",
  mysql: "simple-icons:mysql",
  mongodb: "simple-icons:mongodb",
  redis: "simple-icons:redis",
  docker: "simple-icons:docker",
  kubernetes: "simple-icons:kubernetes",
  aws: "simple-icons:amazonaws",
  azure: "simple-icons:microsoftazure",
  gcp: "simple-icons:googlecloud",
  react: "simple-icons:react",
  vue: "simple-icons:vuedotjs",
  angular: "simple-icons:angular",
  nodejs: "simple-icons:nodedotjs",
  python: "simple-icons:python",
  java: "simple-icons:openjdk",
  go: "simple-icons:go",
  rust: "simple-icons:rust",
  typescript: "simple-icons:typescript",
  javascript: "simple-icons:javascript",
  graphql: "simple-icons:graphql",
  linux: "simple-icons:linux",
  git: "simple-icons:git",
  github: "simple-icons:github",
  gitlab: "simple-icons:gitlab",
  terraform: "simple-icons:terraform",
  ansible: "simple-icons:ansible",
  prometheus: "simple-icons:prometheus",
  grafana: "simple-icons:grafana",
  elasticsearch: "simple-icons:elasticsearch",
  kafka: "simple-icons:apachekafka",
  nginx: "simple-icons:nginx",
  apache: "simple-icons:apache",
  flutter: "simple-icons:flutter",
  ios: "simple-icons:apple",
  android: "simple-icons:android",
  tensorflow: "simple-icons:tensorflow",
  pytorch: "simple-icons:pytorch",
  firebase: "simple-icons:firebase",
  supabase: "simple-icons:supabase",
  vercel: "simple-icons:vercel",
  cloudflare: "simple-icons:cloudflare",
  sentry: "simple-icons:sentry",
  datadog: "simple-icons:datadog",
  splunk: "simple-icons:splunk",
  ai: "mdi:brain",
  security: "mdi:shield-lock",
};

function getTechIconName(name: string): string | null {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return TECH_ICON_MAP[normalized] ?? null;
}

function SystemDetailPage() {
  const {
    system,
    media,
    packages: initialPackages,
    reviews: initialReviews,
    vendor,
    technologies,
    contacts,
  } = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [packages] = useState<TcoPackage[]>(initialPackages ?? []);
  const [reviews] = useState<Review[]>(initialReviews ?? []);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewPros, setReviewPros] = useState("");
  const [reviewCons, setReviewCons] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [showMore, setShowMore] = useState(false);

  const handleMessageVendor = async () => {
    if (!messageBody.trim() || messageSending) return;
    setMessageSending(true);
    setMessageError("");
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          system_id: system.id,
          subject: `Question about ${system.name}`,
          message: messageBody.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        thread?: { id: string };
        thread_id?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to start conversation");
      const threadId = data.thread?.id ?? data.thread_id;
      setMessageOpen(false);
      setMessageBody("");
      if (threadId) {
        router.navigate({ to: "/chats", search: { thread: threadId } });
      } else {
        router.navigate({ to: "/chats" });
      }
    } catch (e) {
      setMessageError(e instanceof Error ? e.message : "Failed to start conversation");
    } finally {
      setMessageSending(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewRating || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch(`/api/systems/${system.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          pros: reviewPros.trim() || undefined,
          cons: reviewCons.trim() || undefined,
          review_text: reviewText.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
      setReviewSuccess("Thank you! Your review has been published.");
      setReviewRating(0);
      setReviewTitle("");
      setReviewPros("");
      setReviewCons("");
      setReviewText("");
      setTimeout(() => {
        setReviewOpen(false);
        setReviewSuccess("");
      }, 2000);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
            <Icon icon={getSystemIcon(system.name, system.icon)} className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">{system.name}</h1>
              {system.verified && (
                <Badge className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {system.trial_available && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Free trial
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              by {system.vendor_name} · {system.category_name}
            </p>
            <p className="mt-2">{system.tagline}</p>
          </div>
          <div className="flex gap-2">
            <WatchlistButton systemId={system.id} user={user} variant="button" />
            {user ? (
              <Button className="gap-2" onClick={() => setMessageOpen(true)}>
                <MessageSquare className="h-4 w-4" />
                Message vendor
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <Link to="/auth/login">
                  <MessageSquare className="h-4 w-4" />
                  Message vendor
                </Link>
              </Button>
            )}
          </div>
        </header>

        <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message {system.vendor_name ?? "vendor"}</DialogTitle>
              <DialogDescription>
                Ask about {system.name}. Your message starts a conversation in Messages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="vendor-message">Your message</Label>
              <Textarea
                id="vendor-message"
                placeholder="Hi, I have a question about…"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={4}
              />
              {messageError && <p className="text-sm text-destructive">{messageError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMessageVendor}
                disabled={!messageBody.trim() || messageSending}
              >
                {messageSending ? "Sending…" : "Send message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a review</DialogTitle>
              <DialogDescription>
                Share your experience with {system.name}. Your review will be published immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Rating</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-2xl bg-transparent border-none p-0 cursor-pointer"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="review-title">Title</Label>
                <Input
                  id="review-title"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <Label htmlFor="review-pros">Pros</Label>
                <Textarea
                  id="review-pros"
                  value={reviewPros}
                  onChange={(e) => setReviewPros(e.target.value)}
                  placeholder="What did you like?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="review-cons">Cons</Label>
                <Textarea
                  id="review-cons"
                  value={reviewCons}
                  onChange={(e) => setReviewCons(e.target.value)}
                  placeholder="What could be improved?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="review-text">Review</Label>
                <Textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us more about your experience"
                  rows={4}
                />
              </div>
              {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}
              {reviewSuccess && <p className="text-sm text-green-600">{reviewSuccess}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReviewSubmit} disabled={!reviewRating || reviewSubmitting}>
                {reviewSubmitting ? "Submitting…" : "Submit review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="tco">TCO Calculator</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardContent className="pt-6 prose prose-sm max-w-none">
                <p>{system.description}</p>
                <p>Deployed via {system.deployment_type?.toLowerCase() || "cloud"}.</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Reviews</h3>
                <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
                  Write a review
                </Button>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Be the first to review.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {reviews.map((r, i) => (
                    <Card key={i} className="h-full">
                      <CardContent className="pt-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {"★".repeat(Math.round(r.rating))}
                            {"☆".repeat(5 - Math.round(r.rating))}
                          </div>
                          {r.is_verified_customer && (
                            <span className="text-xs text-muted-foreground">Verified customer</span>
                          )}
                        </div>
                        {r.title && <p className="font-medium text-sm">{r.title}</p>}
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {r.pros && (
                            <p>
                              <span className="font-medium text-foreground">Pros:</span> {r.pros}
                            </p>
                          )}
                          {r.cons && (
                            <p>
                              <span className="font-medium text-foreground">Cons:</span> {r.cons}
                            </p>
                          )}
                        </div>
                        {r.review_text && <p className="text-sm line-clamp-4">{r.review_text}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Media</h3>
              {media.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {media.map((m) => (
                    <div
                      key={m.id}
                      className="aspect-video rounded-lg bg-secondary overflow-hidden"
                    >
                      {m.media_type === "video" ? (
                        <video src={m.url} className="h-full w-full object-cover" controls />
                      ) : (
                        <img
                          src={m.url}
                          alt={m.caption ?? m.id}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-video rounded-lg bg-secondary" />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            {packages.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{pkg.name}</CardTitle>
                        {pkg.is_popular && (
                          <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
                            <Star className="h-3 w-3 fill-amber-500" /> Popular
                          </Badge>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div className="text-2xl font-semibold">
                        {pkg.contact_sales ? (
                          "Contact Sales"
                        ) : pkg.is_free ? (
                          "Free"
                        ) : (
                          <>
                            {pkg.currency} {formatPrice(pkg.base_price)}
                            {pkg.billing_cadence && (
                              <span className="text-sm text-muted-foreground">
                                /{pkg.billing_cadence}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {pkg.trial_available && (
                        <Badge variant="secondary" className="gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          {pkg.trial_duration_days}-day free trial
                        </Badge>
                      )}
                      {pkg.is_unlimited_seats && (
                        <p className="text-xs text-muted-foreground">Unlimited seats</p>
                      )}
                      {pkg.minimum_seats && !pkg.is_unlimited_seats && (
                        <p className="text-xs text-muted-foreground">
                          {pkg.minimum_seats} - {pkg.maximum_seats ?? "unlimited"} seats
                        </p>
                      )}
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Included features:</p>
                        {pkg.features.length > 0 ? (
                          <ul className="space-y-1">
                            {pkg.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-sm">
                                <Check className="h-3 w-3 text-primary mt-0.5" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No features listed</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pricing packages configured.</p>
            )}
          </TabsContent>

          <TabsContent value="features">
            {(() => {
              const allFeatures = Array.from(
                new Set(packages.flatMap((pkg) => pkg.features)),
              ).sort();
              return allFeatures.length > 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {allFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">No features linked to packages yet.</p>
              );
            })()}
          </TabsContent>

          <TabsContent value="tco">
            <SystemTcoCalculator systemName={system.name} packages={packages} />
          </TabsContent>

          <TabsContent value="links">
            <Card>
              <CardContent className="pt-6 space-y-2">
                {[
                  ["Website", system.vendor_website],
                  ["Documentation", null],
                  ["LinkedIn", (system.social_links as any)?.linkedin || null],
                  ["YouTube demo", null],
                ]
                  .filter(([, url]) => !!url)
                  .map(([l, h]) => (
                    <Link
                      key={l}
                      to="."
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> {l}{" "}
                      <span className="text-muted-foreground">— {h as string}</span>
                    </Link>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            {vendor ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-24 w-24 shrink-0 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                            {vendor.logo_url ? (
                              <img
                                src={vendor.logo_url}
                                alt={vendor.company_name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Building2 className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-bold">{vendor.company_name}</h2>
                              <Badge variant="secondary" className="gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Active
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                              {vendor.location || vendor.location_label ? (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.location || vendor.location_label)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                  {vendor.location_label || vendor.location}
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" />
                                  No location
                                </span>
                              )}
                              {vendor.website ? (
                                <a
                                  href={vendor.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                >
                                  <Globe className="h-3.5 w-3.5" />
                                  {vendor.website.replace(/^https?:\/\//, "")}
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                  <Globe className="h-3.5 w-3.5" />
                                  No website
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {vendor.description && (
                          <div className="space-y-1">
                            <p
                              className={`text-sm text-muted-foreground leading-relaxed ${
                                showMore ? "" : "line-clamp-2"
                              }`}
                            >
                              {vendor.description}
                            </p>
                            {vendor.description.length > 120 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMore(!showMore)}
                                className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent"
                              >
                                {showMore ? "Show Less" : "Show More"}
                                {showMore ? (
                                  <ChevronUp className="ml-1 h-3 w-3" />
                                ) : (
                                  <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Industry</p>
                      <p className="font-medium">{vendor.industry || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company size</p>
                      <p className="font-medium">{vendor.company_size || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Founded</p>
                      <p className="font-medium">{vendor.founded_date || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Technologies</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {technologies.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No technologies listed.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {technologies.map((tech) => {
                            const iconName = getTechIconName(tech.name);
                            return (
                              <div
                                key={tech.id}
                                className="flex items-center gap-2 rounded-lg border border-border p-2"
                              >
                                <span
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                                  style={{ backgroundColor: tech.color }}
                                >
                                  {iconName && <Icon icon={iconName} className="h-4 w-4" />}
                                </span>
                                <span className="truncate text-sm font-medium">{tech.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Key Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {contacts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No contacts listed.</p>
                      ) : (
                        contacts.map((contact) => (
                          <div key={contact.id} className="flex items-start gap-3">
                            <Avatar className="h-9 w-9">
                              {contact.avatar_url ? <AvatarImage src={contact.avatar_url} /> : null}
                              <AvatarFallback className="text-xs">
                                {contact.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-sm font-medium truncate">{contact.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.role}
                              </p>
                              <p className="text-xs text-primary truncate">{contact.email}</p>
                            </div>
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Email
                            </a>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No company profile available for this system.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
