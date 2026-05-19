import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <Card>
          <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {["System", "Light", "Dark"].map((t) => (
                <Button key={t} variant="outline" size="sm">{t}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Row label="New vendor reply" hint="Email me when a vendor responds to a thread" />
            <Row label="Price change on watchlist" hint="Email me when a saved system changes pricing" />
            <Row label="Weekly digest" hint="A summary of new systems and updates" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Email digest</CardTitle></CardHeader>
          <CardContent>
            <Label>Cadence</Label>
            <select className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Off</option><option>Daily</option><option>Weekly</option><option>Monthly</option>
            </select>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Row({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch />
    </div>
  );
}
