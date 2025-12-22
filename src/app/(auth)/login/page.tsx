"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, Mail, Lock, User, Sparkles, ArrowRight, Wand2, 
  KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff, 
  Building2, ShieldCheck, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'magic-link';

function LoginContent() {
  const searchParams = useSearchParams();
  const hostelName = searchParams.get("hostelName");
  const mode = searchParams.get("mode");
  const returnTo = searchParams.get("returnTo");
  
  const [authMode, setAuthMode] = useState<AuthMode>(mode === "signup" ? 'signup' : 'login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();

  const isLogin = authMode === 'login';
  const isSignup = authMode === 'signup';
  const isForgotPassword = authMode === 'forgot-password';
  const isMagicLink = authMode === 'magic-link';

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

      setEmailSent(true);
      toast.success('Reset link sent!', { 
        description: 'Check your email for the password reset link.' 
      });
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email.trim()) throw new Error("Email is required");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${returnTo || '/'}`,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Magic link sent!', { 
        description: 'Check your email and click the link to sign in.' 
      });
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError(err.message || "Failed to send magic link");
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
      if (!password) throw new Error("Password is required");

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          throw error;
        }
        toast.success('Logged in successfully!', { description: 'Welcome back!' });
        router.push(returnTo || "/");
      } else {
        if (!username.trim()) throw new Error("Username is required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        
        const { data, error } = await signUp(email, password, username);
        if (error) {
          if (error.message?.includes('already registered')) {
            throw new Error('Email is already registered');
          }
          throw error;
        }

        toast.success('Account created!', { description: 'Welcome to the platform!' });

        if (hostelName && data.user) {
          // Wait for profile creation
          let profileExists = false;
          let attempts = 0;
          while (!profileExists && attempts < 10) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', data.user.id)
              .single();
            
            if (profileData) {
              profileExists = true;
              break;
            }
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          if (!profileExists) {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              username,
              full_name: username,
            });
          }

          const { data: space, error: spaceError } = await supabase
            .from('spaces')
            .insert({ name: hostelName.trim(), created_by: data.user.id })
            .select()
            .single();

          if (spaceError) throw spaceError;

          await supabase.from('space_members').insert({
            space_id: space.id,
            user_id: data.user.id,
            role: 'admin',
            points: 0,
          });

          await refreshSpaces();
          setCurrentSpace(space);
          toast.success(`Hostel "${hostelName}" created successfully!`);
          router.push(`/spaces/create?success=true&id=${space.id}`);
          return;
        }
        router.push(returnTo || "/");
      }
    } catch (err: any) {
      console.error('Login/Signup error:', err);
      setError(err.message || err.error_description || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setAuthMode('login');
    setError("");
    setEmailSent(false);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left Column - Visuals */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-zinc-900 text-white overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/90" />
        
        {/* Animated Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow" />
          <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[100px] animate-pulse-slow delay-1000" />
        </div>

        {/* Content */}
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
              &ldquo;The easiest way to manage your hostel life. From duty rosters to expense tracking, everything is streamlined.&rdquo;
            </p>
            <footer className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <User className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <div className="font-semibold">Alex Chen</div>
                <div className="text-sm text-zinc-400">Resident Assistant</div>
              </div>
            </footer>
          </blockquote>
          
          <div className="flex gap-4 pt-8">
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700/50 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              Secure & Private
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700/50 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              Real-time Updates
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          © 2024 HostelMate Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold tracking-tight mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            HostelMate
          </div>

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              {authMode === 'login' && "Welcome back"}
              {authMode === 'signup' && "Create an account"}
              {authMode === 'forgot-password' && "Reset password"}
              {authMode === 'magic-link' && "Check your email"}
            </h1>
            <p className="text-muted-foreground">
              {authMode === 'login' && "Enter your details to access your account"}
              {authMode === 'signup' && (hostelName ? `Setting up "${hostelName}"` : "Enter your details to get started")}
              {authMode === 'forgot-password' && "We'll send you a reset link"}
              {authMode === 'magic-link' && "We'll send you a magic link to sign in"}
            </p>
          </div>

          {/* Success State */}
          {emailSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-4"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  We&apos;ve sent a link to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button variant="outline" onClick={() => setEmailSent(false)} className="w-full">
                Try again
              </Button>
              <Button variant="ghost" onClick={resetToLogin} className="w-full">
                Back to login
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Forms */}
              <form onSubmit={
                isForgotPassword ? handleForgotPassword : 
                isMagicLink ? handleMagicLink : 
                handleSubmit
              } className="space-y-4">
                
                {isSignup && (
                  <div className="space-y-2">
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
                  </div>
                )}

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

                {(!isForgotPassword && !isMagicLink) && (
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
                      className="text-sm text-destructive bg-destructive/10 p-3 rounded-md font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full" disabled={loading} size="lg">
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin && "Sign In"}
                      {isSignup && "Create Account"}
                      {isForgotPassword && "Send Reset Link"}
                      {isMagicLink && "Send Magic Link"}
                    </>
                  )}
                </Button>
              </form>

              {/* Divider & Social */}
              {isLogin && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => { setAuthMode('magic-link'); setError(""); }}
                      className="w-full"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Magic Link
                    </Button>
                    <Button
                      variant="outline"
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
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                  </div>
                </>
              )}

              {/* Footer Links */}
              <div className="text-center text-sm">
                {(isForgotPassword || isMagicLink) ? (
                  <button
                    onClick={resetToLogin}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </button>
                ) : (
                  <p className="text-muted-foreground">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      onClick={() => { setAuthMode(isLogin ? 'signup' : 'login'); setError(""); }}
                      className="font-semibold text-primary hover:underline"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                )}
              </div>
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
