"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, Mail, Lock, User, ArrowRight, Wand2, 
  Eye, EyeOff, ShieldCheck, Zap, AlertCircle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

type AuthMode = 'login' | 'signup' | 'forgot-password';

function LoginContent() {
  const searchParams = useSearchParams();
  const hostelName = searchParams.get("hostelName");
  const mode = searchParams.get("mode");
  const returnTo = searchParams.get("returnTo");
  
  // Default to login unless explicitly signup or hostel creation
  const [authMode, setAuthMode] = useState<AuthMode>(
    (mode === "signup" || hostelName) ? 'signup' : 'login'
  );
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();

  const isLogin = authMode === 'login';
  const isSignup = authMode === 'signup';
  const isForgotPassword = authMode === 'forgot-password';

  useEffect(() => {
    if (hostelName) {
      setAuthMode('signup');
    }
  }, [hostelName]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email.trim()) throw new Error("Email is required");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?mode=reset`,
      });

      if (error) throw error;

      toast.success('Reset link sent!', { 
        description: 'Check your email for the password reset link.' 
      });
      setAuthMode('login');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email.trim()) throw new Error("Email is required");
      
      if (isForgotPassword) {
        await handleForgotPassword(e);
        return;
      }

      if (!password) throw new Error("Password is required");

      if (isLogin) {
        // Attempt Login
        const { error } = await signIn(email, password);
        if (error) {
          // Smart handling: If invalid credentials, it might be a new user
          if (error.message?.includes('Invalid login credentials')) {
            // Don't auto-switch, but suggest it clearly
            setError("Invalid email or password.");
          } else {
            throw error;
          }
        } else {
          toast.success('Welcome back!');
          router.push(returnTo || "/");
        }
      } else {
        // Attempt Signup
        if (!username.trim()) throw new Error("Username is required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        
        const { data, error } = await signUp(email, password, username);
        if (error) {
          if (error.message?.includes('already registered')) {
            setError('This email is already registered. Please sign in.');
            setAuthMode('login'); // Auto-switch back to login if they exist
          } else {
            throw error;
          }
        } else {
          toast.success('Account created successfully!');

          // Handle Hostel Creation if needed
          if (hostelName && data.user) {
            await handleHostelCreation(data.user.id, username);
          } else {
            router.push(returnTo || "/");
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleHostelCreation = async (userId: string, userName: string) => {
    try {
      // Wait for profile creation (handled by trigger, but might have slight delay)
      let profileExists = false;
      let attempts = 0;
      while (!profileExists && attempts < 10) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (profileData) {
          profileExists = true;
          break;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!profileExists) {
        // Fallback: Create profile manually if trigger failed/delayed
        await supabase.from('profiles').upsert({
          id: userId,
          username: userName,
          full_name: userName,
        });
      }

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
      toast.error("Account created, but failed to create hostel. Please try creating it from the dashboard.");
      router.push("/");
    }
  };

  const toggleMode = () => {
    setAuthMode(isLogin ? 'signup' : 'login');
    setError("");
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left Column - Visuals */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-zinc-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/90" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            HostelMate
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium leading-relaxed">
              &ldquo;Living together is an art. We make it a science.&rdquo;
            </p>
          </blockquote>
          <div className="flex gap-4 pt-8">
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700/50 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              Secure
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700/50 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              Fast
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          © 2024 HostelMate Inc.
        </div>
      </div>

      {/* Right Column - Unified Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold tracking-tight mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            HostelMate
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              {isForgotPassword ? "Reset Password" : (hostelName ? "Create Your Hostel" : "Welcome")}
            </h1>
            <p className="text-muted-foreground">
              {isForgotPassword 
                ? "Enter your email to receive a reset link" 
                : "Enter your details to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="username">Username</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required={isSignup}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot-password'); setError(""); }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md font-medium"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? "Send Reset Link" : (isLogin ? "Continue" : "Create Account")}
                  {!loading && !isForgotPassword && <ArrowRight className="ml-2 h-4 w-4" />}
                </>
              )}
            </Button>
          </form>

          {/* Unified Toggle */}
          {!isForgotPassword && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {isLogin ? "New here?" : "Have an account?"}
                </span>
              </div>
            </div>
          )}

          {!isForgotPassword && (
            <Button
              variant="outline"
              onClick={toggleMode}
              className="w-full"
            >
              {isLogin ? "Create an account" : "Sign in instead"}
            </Button>
          )}

          {isForgotPassword && (
            <Button
              variant="ghost"
              onClick={() => setAuthMode('login')}
              className="w-full"
            >
              Back to login
            </Button>
          )}

          {/* Social Login - Simplified */}
          {isLogin && !isForgotPassword && (
            <div className="pt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback`,
                        queryParams: { access_type: 'offline', prompt: 'consent' },
                      },
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    setError(err.message);
                    setLoading(false);
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
