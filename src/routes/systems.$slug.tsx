import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { MessageSquare, ShieldCheck, ExternalLink, Check, Minus, Star } from "lucide-react";
import { query, queryOne } from "@/lib/db";
import { WatchlistButton } from "@/components/watchlist-button";

type PricingPackage = {
  id: string;
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
  features: string[];
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
       v.company_name AS vendor_name
    FROM systems s
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN vendors v ON s.vendor_id = v.id
    WHERE s.slug = $1 AND s.status = 'active'`,
    [slug],
  );
  if (!system) return null;

  const [media, packages] = await Promise.all([
    query<{ id: string; media_type: string; url: string; caption: string | null }>(
      "SELECT id, media_type, url, caption FROM system_media WHERE system_id = $1 ORDER BY sort_order",
      [system.id],
    ),
    query<PricingPackage>(
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
  ]);

  return { system, media, packages };
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

function SystemDetailPage() {
  const { system, media, packages: initialPackages } = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [packages] = useState<PricingPackage[]>(initialPackages ?? []);

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-wrap items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-secondary" />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">{system.name}</h1>
              {system.verified && (
                <Badge className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
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
            <Card>
              <CardContent className="pt-6 prose prose-sm max-w-none">
                <p>{system.description}</p>
                <p>Deployed via {system.deployment_type?.toLowerCase() || "cloud"}.</p>
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                label="Security"
                value={system.security_certifications?.join(", ") || "None listed"}
              />
              <InfoCard
                label="Features"
                value={
                  `${system.has_api ? "API, " : ""}${system.has_mobile_app ? "Mobile, " : ""}${system.has_ai_features ? "AI" : ""}` ||
                  "Standard"
                }
              />
              <InfoCard label="Starting price" value={system.starting_price} />
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
                            {pkg.currency} {pkg.base_price}
                            {pkg.billing_cadence && (
                              <span className="text-sm text-muted-foreground">
                                /{pkg.billing_cadence}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {pkg.trial_available && (
                        <p className="text-xs text-muted-foreground">
                          {pkg.trial_duration_days}-day free trial
                        </p>
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
            <Card>
              <CardContent className="pt-6">
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
                            {v ? (
                              <Check className="inline h-4 w-4 text-primary" />
                            ) : (
                              <Minus className="inline h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tco">
            <Card>
              <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>Seats</Label>
                    <Input type="number" defaultValue={50} />
                  </div>
                  <div>
                    <Label>Term length</Label>
                    <select className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>1 year</option>
                      <option>3 years</option>
                      <option>5 years</option>
                    </select>
                  </div>
                  <div>
                    <Label>Annual escalation %</Label>
                    <Slider defaultValue={[5]} max={20} step={1} className="mt-3" />
                  </div>
                  <div>
                    <Label>Discount %</Label>
                    <Slider defaultValue={[10]} max={50} step={1} className="mt-3" />
                  </div>
                  <div>
                    <Label>Implementation cost</Label>
                    <Input type="number" defaultValue={5000} />
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-6 space-y-3">
                  <div className="text-sm text-muted-foreground">Estimated TCO (3 years)</div>
                  <div className="text-4xl font-semibold">$182,400</div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Year 1</span>
                      <span>$56,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year 2</span>
                      <span>$60,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year 3</span>
                      <span>$65,600</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            {media.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {media.map((m) => (
                  <div key={m.id} className="aspect-video rounded-lg bg-secondary overflow-hidden">
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
          </TabsContent>

          <TabsContent value="links">
            <Card>
              <CardContent className="pt-6 space-y-2">
                {[
                  ["Website", "https://example.com"],
                  ["Documentation", "https://docs.example.com"],
                  ["LinkedIn", "https://linkedin.com/company/example"],
                  ["YouTube demo", "https://youtube.com/example"],
                ].map(([l, h]) => (
                  <Link key={l} to="." className="flex items-center gap-2 text-sm hover:underline">
                    <ExternalLink className="h-4 w-4" /> {l}{" "}
                    <span className="text-muted-foreground">— {h}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
