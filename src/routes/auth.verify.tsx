import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/auth/verify')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { token } = useSearch({ from: '/auth/verify' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided');
      setLoading(false);
      return;
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSuccess(true);
          setUser(data.user);
        } else {
          setError(data.error || 'Verification failed');
        }
      })
      .catch(() => setError('Verification failed'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center text-muted-foreground">Verifying your email…</CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email verified!</CardTitle>
          <CardDescription>Your account is ready to use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Welcome{user?.name ? `, ${user.name}` : ''}! You can now sign in.</p>
          <Button asChild className="w-full"><Link to="/auth/login">Sign in</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verification failed</CardTitle>
        <CardDescription>{error}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button asChild variant="outline"><Link to="/auth/signup">Sign up again</Link></Button>
        <Button asChild><Link to="/auth/login">Sign in</Link></Button>
      </CardContent>
    </Card>
  );
}
