import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/forgot")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { devResetUrl?: string };
    if (data.devResetUrl) {
      setDevResetUrl(data.devResetUrl);
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>We'll email you a reset link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If an account exists, a reset link has been sent.
            </p>
            {devResetUrl && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-medium text-amber-900">Dev mode — no SMTP configured</p>
                <p className="mt-1 text-amber-800">
                  Open this link to reset your password:{" "}
                  <a href={devResetUrl} className="break-all font-mono underline">
                    {devResetUrl}
                  </a>
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <Link to="/auth/login" className="text-sm text-muted-foreground hover:underline">Back to sign in</Link>
      </CardContent>
    </Card>
  );
}
