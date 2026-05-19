import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/reset")({
  component: ResetPage,
});

function ResetPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a strong password (min. 8 characters).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" /></div>
        <div className="space-y-2"><Label htmlFor="pw2">Confirm new password</Label><Input id="pw2" type="password" /></div>
        <Button className="w-full">Update password</Button>
      </CardContent>
    </Card>
  );
}
