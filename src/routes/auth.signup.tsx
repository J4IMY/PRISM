import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signup } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    vendor: (search.vendor as string) || undefined,
  }),
  component: SignupPage,
});

function SignupPage() {
  const { vendor } = useSearch({ from: "/auth/signup" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [applyAsVendor, setApplyAsVendor] = useState(vendor === "1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signup({ email, password, name, vendorApplication: applyAsVendor });
      if (result.success) {
        setSavedEmail(email);
        if (result.devVerificationUrl) {
          setDevVerificationUrl(result.devVerificationUrl);
        }
        setSuccess(true);
      } else {
        setError(result.error || "Failed to create account");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Created!</CardTitle>
          <CardDescription>Check your email to verify your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            We've sent a verification email to <span className="font-semibold">{savedEmail}</span>
          </p>
          {devVerificationUrl && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">Dev mode — no SMTP configured</p>
              <p className="mt-1 text-amber-800">
                Open this link to verify your account:{" "}
                <a href={devVerificationUrl} className="break-all font-mono underline">
                  {devVerificationUrl}
                </a>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full"><Link to="/auth/login">Go to Login</Link></Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          {applyAsVendor
            ? "Register with your company email. We'll send a verification link."
            : "We'll send a verification email."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name (Optional)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="apply-as-vendor"
              checked={applyAsVendor}
              onCheckedChange={(checked) => setApplyAsVendor(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="apply-as-vendor" className="text-sm font-normal cursor-pointer">
                Apply as a software vendor
              </Label>
              {applyAsVendor && (
                <p className="text-xs text-muted-foreground">
                  Use your work email — personal domains like Gmail and Outlook are not accepted.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={applyAsVendor ? "you@company.com" : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account? <Link to="/auth/login" className="ml-1 text-foreground hover:underline">Sign in</Link>
      </CardFooter>
    </Card>
  );
}
