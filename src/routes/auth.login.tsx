import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { login } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    google: (search.google as string) || undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { google } = useSearch({ from: "/auth/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [applyAsVendor, setApplyAsVendor] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      await router.invalidate();
      router.navigate({ to: result.redirectTo ?? "/" });
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to PRISM.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {google === "unavailable" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Google sign-in is not configured yet. Set GOOGLE_CLIENT_ID in your environment to enable
            it.
          </div>
        )}
        {google === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Google sign-in failed. Please try again or use email.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = "/api/auth/google";
          }}
        >
          Continue with Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/auth/forgot"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-4">
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
                Sign up with your company email to list software on PRISM.
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          No account?{" "}
          <Link
            to="/auth/signup"
            search={applyAsVendor ? { vendor: "1" } : {}}
            className="text-foreground hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
