'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/admin/session', { cache: 'no-store' });
        if (!res.ok) {
          setIsAuthenticated(false);
          return;
        }
        const data = (await res.json()) as { authenticated?: boolean };
        setIsAuthenticated(Boolean(data.authenticated));
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        setIsAuthenticated(false);
        setError(data?.error || 'Invalid admin password');
        setPassword('');
        return;
      }

      setIsAuthenticated(true);
      setPassword('');
    } catch {
      setIsAuthenticated(false);
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/session', { method: 'DELETE' });
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="text-sm text-muted-foreground">Loading admin session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-primary h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground">Enter password (digits 1-9) to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter digits 1-9"
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[1-9]*$/.test(val)) {
                      setPassword(val);
                    }
                  }}
                  className="text-center text-2xl tracking-[1em]"
                  maxLength={9}
                />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Unlocking…' : 'Unlock Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}
