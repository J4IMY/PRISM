import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Upload, Plus, Trash2 } from "lucide-react";
import { mockSystems } from "@/lib/mock-data";

export const Route = createFileRoute("/vendor/systems/$id")({
  component: VendorSystemEditPage,
  loader: ({ params }) => {
    const system = mockSystems.find((s) => s.id === params.id);
    if (!system) throw notFound();
    return { system };
  },
});

function VendorSystemEditPage() {
  const { system } = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <Link to="/vendor/systems" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" />Back to systems</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{system.name}</h1>
          <p className="text-sm text-muted-foreground">Edit listing details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Save draft</Button>
          <Button>Publish</Button>
        </div>
      </div>

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
          <Card><CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
            <div><Label>Name</Label><Input defaultValue={system.name} /></div>
            <div><Label>Category</Label><Input defaultValue={system.category} /></div>
            <div className="sm:col-span-2"><Label>Tagline</Label><Input defaultValue={system.tagline} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={6} defaultValue={system.description} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="space-y-3">
            {["Starter","Growth","Enterprise"].map((p) => (
              <Card key={p}><CardContent className="pt-6 grid gap-4 sm:grid-cols-4 items-end">
                <div><Label>Package</Label><Input defaultValue={p} /></div>
                <div><Label>Model</Label>
                  <select className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Per-seat</option><option>Flat</option><option>Per-usage</option><option>Tiered</option><option>Hybrid</option>
                  </select>
                </div>
                <div><Label>Base price</Label><Input type="number" defaultValue={15} /></div>
                <div><Label>Cadence</Label>
                  <select className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Monthly</option><option>Annual</option><option>Custom</option>
                  </select>
                </div>
              </CardContent></Card>
            ))}
            <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Add package</Button>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card><CardContent className="pt-6 space-y-3">
            {["Single sign-on","Audit log","Custom roles","API access"].map((f) => (
              <div key={f} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{f}</p>
                  <p className="text-xs text-muted-foreground">Available on Growth and Enterprise</p>
                </div>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Add feature</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="media">
          <Card><CardContent className="pt-6">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
              <Upload className="mx-auto h-8 w-8 mb-2" />
              <p>Drag & drop screenshots or click to upload</p>
              <p className="text-xs mt-1">PNG, JPG, MP4 up to 50 MB</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4 mt-4">
              {Array.from({length:4}).map((_,i)=>(<div key={i} className="aspect-video rounded-md bg-secondary"/>))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="links">
          <Card><CardContent className="pt-6 space-y-4">
            {["Website","Documentation","YouTube demo","LinkedIn"].map((l)=>(
              <div key={l}><Label>{l}</Label><Input placeholder={`https://...`} /></div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card><CardContent className="pt-6 grid gap-4">
            <div><Label>Slug</Label><Input defaultValue={system.slug} /></div>
            <div><Label>Meta title</Label><Input defaultValue={`${system.name} — ${system.vendor}`} /></div>
            <div><Label>Meta description</Label><Textarea rows={3} defaultValue={system.tagline} /></div>
            <div className="flex gap-2"><Badge variant="outline">SEO score: 82</Badge><Badge variant="secondary">Indexed</Badge></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
