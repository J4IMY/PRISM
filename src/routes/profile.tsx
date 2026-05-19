import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Profile</h1>

        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Username</Label><Input defaultValue="alex.kim" /></div>
            <div><Label>Email</Label><Input type="email" defaultValue="alex@acme.com" /></div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Current password</Label><Input type="password" /></div>
            <div><Label>New password</Label><Input type="password" /></div>
            <Button>Update password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline">Export my data (JSON)</Button>
            <div>
              <Button variant="destructive">Request data deletion</Button>
              <p className="mt-2 text-xs text-muted-foreground">Your request will be reviewed within 30 days (GDPR).</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
