"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

type AuthMode = 'login' | 'signup' | 'forgot-password';

function LoginContent() {
  const searchParams = useSearchParams();
  const hostelName = searchParams.get("hostelName");
  const mode = searchParams.get("mode");
  const returnTo = searchParams.get("returnTo");
  
  const [authMode, setAuthMode] = useState<AuthMode>(
    (mode === "signup" || hostelName) ? 'signup' : 'login'
  );
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();

  const isLogin = authMode === 'login';
  const isSignup = authMode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?mode=reset`,
        });
        if (error) throw error;
        toast.success('Reset link sent to your email');
        setAuthMode('login');
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!');
        router.push(returnTo || "/");
      } else {
        const { data, error } = await signUp(email, password, username);
        if (error) throw error;
        
        if (hostelName && data.user) {
          await handleHostelCreation(data.user.id, username);
        } else {
          toast.success('Account created successfully!');
          router.push(returnTo || "/");
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHostelCreation = async (userId: string, userName: string) => {
    try {
      // Ensure profile exists
      await supabase.from('profiles').upsert({
        id: userId,
        username: userName,
        full_name: userName,
      });

      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert({ name: hostelName!.trim(), created_by: userId })
        .select()
        .single();

      if (spaceError) throw spaceError;

      await supabase.from('space_members').insert({
        space_id: space.id,
        user_id: userId,
        role: 'admin',
        points: 0,
      });

      await refreshSpaces();
      setCurrentSpace(space);
      toast.success(`Hostel "${hostelName}" created!`);
      router.push(`/spaces/create?success=true&id=${space.id}`);
    } catch (err: any) {
      console.error('Hostel creation error:', err);
      toast.error("Failed to create hostel automatically. Please try from dashboard.");
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 bg-muted relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Manage your hostel life with <span className="text-primary">elegance</span>.
            </h1>
            <p className="text-lg text-muted-foreground">
              Join thousands of students who use HostelMate to keep their shared spaces organized, fair, and fun.
            </p>
          </div>
          
          <div className="grid gap-4">
            {[
              "Smart task distribution algorithms",
              "Real-time notifications & updates",
              "Gamified points & rewards system",
              "Transparent duty tracking"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-foreground/80">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block mb-4">
              <Logo size="md" />
            </Link>
            <h2 className="text-2xl font-bold tracking-tight">
              {authMode === 'forgot-password' ? 'Reset Password' : 
               isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {authMode === 'forgot-password' ? 'Enter your email to receive a reset link' :
               isLogin ? 'Enter your credentials to access your account' : 
               'Get started with your free account today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={isSignup}
                    className="bg-muted/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>

            {authMode !== 'forgot-password' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot-password')}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {authMode === 'forgot-password' ? 'Send Reset Link' : 
                   isLogin ? 'Sign In' : 'Create Account'}
                  {authMode !== 'forgot-password' && <ArrowRight className="ml-2 h-4 w-4" />}
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={() => {
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` }
              });
            }}
            className="w-full"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>

          <div className="text-center text-sm">
            {authMode === 'forgot-password' ? (
              <button
                onClick={() => setAuthMode('login')}
                className="text-primary hover:underline font-medium"
              >
                Back to login
              </button>
            ) : (
              <>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setAuthMode(isLogin ? 'signup' : 'login')}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
