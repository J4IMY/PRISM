import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { requireRoles } from "@/lib/route-guards";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context }) => {
    requireRoles(context.user, ["user", "vendor", "moderator", "admin"]);
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isPrivileged = user && ["admin", "moderator", "vendor"].includes(user.role);

  const handleSaveName = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; name?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update name");
      setMessage("Name updated");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Profile & Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
                <Button onClick={handleSaveName} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" defaultValue={user?.email ?? ""} readOnly />
            </div>
            {isPrivileged && (
              <div>
                <Label>Role</Label>
                <Input defaultValue={user?.role ?? ""} readOnly />
              </div>
            )}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Current: {theme}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
              >
                System
              </Button>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/settings">More settings</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
