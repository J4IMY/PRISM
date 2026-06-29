import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { query, queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

type SystemRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  verified: boolean;
  pricing_tier: string;
  starting_price: string;
  status: string;
  updated_at: string | null;
  category_name: string | null;
};

const getSystems = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const user = await getAuthUser(request);
  if (!user) return [];

  const member = await queryOne<{ vendor_id: string }>(
    "SELECT vendor_id FROM vendor_members WHERE user_id = $1",
    [user.id],
  );
  if (!member) return [];

  return query<SystemRow>(
    `SELECT
       s.id, s.name, s.slug, s.tagline,
       s.verified, s.pricing_tier, s.starting_price,
       s.status, s.updated_at,
       c.name AS category_name
      FROM systems s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.vendor_id = $1
      ORDER BY s.updated_at DESC`,
    [member.vendor_id],
  );
});

export const Route = createFileRoute("/vendor/systems/")({
  loader: async () => {
    const systems = await getSystems();
    return { systems };
  },
  component: VendorSystemsPage,
});

function VendorSystemsPage() {
  const { systems } = Route.useLoaderData();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateSystem = async () => {
    if (!name.trim() || creating) return;

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/vendor-systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          website_url: websiteUrl.trim() || null,
          status: "draft",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        system?: { id: string };
      };

      if (!res.ok) throw new Error(data.error ?? "Failed to create system");

      setCreateOpen(false);
      setName("");
      setTagline("");
      setDescription("");
      setWebsiteUrl("");
      router.navigate({ to: "/vendor/systems/$id", params: { id: data.system?.id ?? "" } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create system");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Systems</h1>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New system
        </Button>
      </div>
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New system</DialogTitle>
            <DialogDescription>
              Create a draft listing for one of your products or services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-system-name">Name</Label>
              <Input
                id="new-system-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Analytics"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-system-tagline">Tagline</Label>
              <Input
                id="new-system-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Insights that help teams move faster"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-system-description">Description</Label>
              <Textarea
                id="new-system-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this system does…"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-system-website">Website</Label>
              <Input
                id="new-system-website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSystem} disabled={!name.trim() || creating}>
              {creating ? "Creating…" : "Create system"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2">Name</th>
                <th>Status</th>
                <th>Last edit</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {systems.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{s.name}</td>
                  <td>
                    <Badge
                      variant={
                        s.status === "active"
                          ? "default"
                          : s.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">
                    {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="text-muted-foreground">you</td>
                  <td>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/vendor/systems/$id" params={{ id: s.id }}>
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
