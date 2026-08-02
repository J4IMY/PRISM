import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Globe, ExternalLink, Image, Tag, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ScrapedPayload = {
  name?: string;
  tagline?: string;
  description?: string;
  website_url?: string;
  starting_price?: string;
  pricing_tier?: string;
  deployment_type?: string;
  industry?: string;
  target_size?: string;
  trial_available?: boolean;
  enterprise_pricing?: boolean;
  features?: unknown[];
  plans?: unknown[];
  media?: { url: string; media_type?: string }[];
  links?: string[];
};

export const Route = createFileRoute("/admin/website-scraper")({
  component: WebsiteScraperPage,
});

function WebsiteScraperPage() {
  const { user } = Route.useRouteContext();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapedPayload | null>(null);
  const [error, setError] = useState<string>("");

  const handleScrape = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/website-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        scraped?: ScrapedPayload;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to scrape");
      setResult(data.scraped ?? null);
      toast.success("Website scraped and queued for review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape");
    } finally {
      setLoading(false);
    }
  };

  const featureLabels = (result?.features ?? []).flatMap((f) => {
    if (typeof f === "string") return [f];
    if (f && typeof f === "object" && "feature_name" in f) {
      return [String((f as { feature_name: string }).feature_name)];
    }
    return [];
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Website Scraper</h1>
          <p className="text-muted-foreground">
            Enter a product website URL to extract system listing fields via ScraperAPI.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleScrape} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="url" className="sr-only">
                  Website URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Scraping…" : "Scrape"}
              </Button>
            </form>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {result.name ?? "Untitled"}
                    </CardTitle>
                    {result.website_url && (
                      <a
                        href={result.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        {result.website_url} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {result.starting_price && (
                    <Badge variant="secondary" className="shrink-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {result.starting_price}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.tagline && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Tagline</p>
                    <p className="text-sm">{result.tagline}</p>
                  </div>
                )}

                {result.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{result.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {result.pricing_tier && <Badge variant="outline">{result.pricing_tier}</Badge>}
                  {result.deployment_type && (
                    <Badge variant="outline">{result.deployment_type}</Badge>
                  )}
                  {result.industry && <Badge variant="outline">{result.industry}</Badge>}
                  {result.target_size && <Badge variant="outline">{result.target_size}</Badge>}
                  {result.trial_available && <Badge variant="outline">Free trial</Badge>}
                  {result.enterprise_pricing && <Badge variant="outline">Enterprise pricing</Badge>}
                </div>

                {featureLabels.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Features ({featureLabels.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {featureLabels.slice(0, 15).map((f, i) => (
                        <span key={i} className="text-xs bg-secondary rounded px-2 py-0.5">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.media && result.media.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Image className="h-3 w-3" /> Media ({result.media.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {result.media.slice(0, 5).map((m, i) => (
                        <p key={i} className="text-xs text-muted-foreground truncate">
                          {m.url}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {result.plans && result.plans.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Pricing plans
                    </p>
                    <pre className="text-xs bg-secondary rounded p-2 overflow-x-auto max-h-40">
                      {JSON.stringify(result.plans, null, 2)}
                    </pre>
                  </div>
                )}

                <Separator />

                {result.links && result.links.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Links ({result.links.length})
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.links.slice(0, 20).map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline block truncate"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
