import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRoles } from "@/lib/route-guards";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { query } from "@/lib/db";
import { ScraperActions } from "@/components/scraper-actions";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import React from "react";

const getScraperItems = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string;
    name: string;
    source: string;
    confidence: number;
    age_days: number;
    status: string;
    created_at: string;
    assigned_to: string | null;
    payload: Record<string, unknown>;
  }>(
    `SELECT id, name, source, confidence, age_days, status, created_at, assigned_to, payload
     FROM scraper_items
     WHERE assigned_to IS NULL
     ORDER BY created_at DESC`,
  );
});

export const Route = createFileRoute("/moderator/scraper")({
  beforeLoad: ({ context }) => {
    requireRoles(context.user, ["moderator", "admin"]);
  },
  loader: async () => {
    try {
      const items = await getScraperItems();
      return { items };
    } catch (err) {
      console.error("Failed to load scraper items:", err);
      return { items: [] };
    }
  },
  component: ScraperQueuePage,
});

function ScraperQueuePage() {
  const router = useRouter();
  const { items } = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleBid = async (itemId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/scraper/${itemId}/assign`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to bid");
        return;
      }
      toast.success("Assigned to you");
      await router.invalidate();
    } catch {
      toast.error("Failed to bid");
    }
  };

  const renderPayload = (payload: Record<string, unknown>) => {
    const entries = Object.entries(payload);
    if (entries.length === 0)
      return <p className="text-xs text-muted-foreground">No scraped data.</p>;

    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => {
          if (Array.isArray(value)) {
            return (
              <div key={key} className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">{key}</p>
                <div className="flex flex-wrap gap-1">
                  {value.map((v, i) => (
                    <span key={i} className="text-xs bg-secondary rounded px-2 py-0.5">
                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          if (value && typeof value === "object") {
            return (
              <div key={key} className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">{key}</p>
                <pre className="text-xs bg-secondary rounded p-2 overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            );
          }

          const text = String(value);
          const isFileUrl = text.startsWith("file:///");

          return (
            <div key={key}>
              <p className="text-xs font-medium text-muted-foreground">{key}</p>
              <p className={`text-xs break-words ${isFileUrl ? "text-red-600" : ""}`}>
                {isFileUrl ? "[local file path omitted]" : text}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Toaster />
      <h1 className="text-2xl font-semibold">Scraper queue</h1>
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2">Name</th>
                <th>Source</th>
                <th>Confidence</th>
                <th>Age</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <React.Fragment key={it.id}>
                  <tr
                    className="border-b border-border last:border-0 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === it.id ? null : it.id)}
                  >
                    <td className="py-3 font-medium">{it.name}</td>
                    <td className="text-muted-foreground">{it.source}</td>
                    <td>{Math.round(it.confidence * 100)}%</td>
                    <td className="text-muted-foreground">{it.age_days}d</td>
                    <td>
                      <Badge variant="outline">{it.status}</Badge>
                    </td>
                    <td className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="secondary" onClick={() => handleBid(it.id)}>
                        Bid
                      </Button>
                      <ScraperActions itemId={it.id} status={it.status} showApprove={false} />
                    </td>
                  </tr>
                  {expandedId === it.id && (
                    <tr key={`${it.id}-payload`}>
                      <td colSpan={6} className="p-0">
                        <div className="bg-secondary/50 p-4 border-b border-border">
                          <p className="text-xs font-medium mb-2">Scraped data</p>
                          {renderPayload(it.payload)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
