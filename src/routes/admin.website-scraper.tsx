import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Globe, ExternalLink, Image, Link2, Tag, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ScrapedPage } from "@/lib/web-scraper";

export const Route = createFileRoute("/admin/website-scraper")({
  component: WebsiteScraperPage,
});

function WebsiteScraperPage() {
  const { user } = Route.useRouteContext();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapedPage | null>(null);
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
        scraped?: ScrapedPage;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to scrape");
      setResult(data.scraped ?? null);
      toast.success("Website scraped successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Website Scraper</h1>
          <p className="text-muted-foreground">
            Enter any product or company website URL to extract system details automatically.
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
                      {result.title}
                    </CardTitle>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      {result.url} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {result.price && (
                    <Badge variant="secondary" className="shrink-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {result.price}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{result.description}</p>
                  </div>
                )}

                {result.keywords && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Keywords</p>
                    <p className="text-sm text-muted-foreground">{result.keywords}</p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {result.pricing && result.pricing.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Pricing mentions
                      </p>
                      <div className="space-y-1">
                        {result.pricing.map((p: string, i: number) => (
                          <p key={i} className="text-xs bg-secondary rounded px-2 py-1">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.images && result.images.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Image className="h-3 w-3" /> Images ({result.images.length})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {result.images.slice(0, 5).map((img: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground truncate">
                            {img}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Content preview
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-4 bg-secondary rounded p-2">
                    {result.content}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Internal links ({result.links?.length ?? 0})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {(result.links ?? []).slice(0, 20).map((link: string, i: number) => (
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
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
