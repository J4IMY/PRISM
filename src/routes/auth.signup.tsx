import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>We'll send a verification email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="email">Work email</Label><Input id="email" type="email" /></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" /></div>
        <div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" /></div>
        <Button className="w-full">Create account</Button>
        <p className="text-xs text-muted-foreground">By signing up you agree to our Terms and Privacy Policy.</p>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account? <Link to="/auth/login" className="ml-1 text-foreground hover:underline">Sign in</Link>
      </CardFooter>
    </Card>
  );
}
