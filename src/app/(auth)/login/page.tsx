"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, Mail, Lock, User, ArrowRight, Wand2, 
  Eye, EyeOff, ShieldCheck, Zap, AlertCircle, Loader2,
  Sparkles, Users, Trophy, CheckCircle
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
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.includes('Invalid login credentials')) {
            setError("Invalid email or password.");
          } else {
            throw error;
          }
        } else {
          toast.success('Welcome back!');
          router.push(returnTo || "/");
        }
      } else {
        if (!username.trim()) throw new Error("Username is required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        
        const { data, error } = await signUp(email, password, username);
        if (error) {
          if (error.message?.includes('already registered')) {
            setError('This email is already registered. Please sign in.');
            setAuthMode('login');
          } else {
            throw error;
          }
        } else {
          toast.success('Account created successfully!');

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

  const features = [
    { icon: Users, text: "Invite unlimited flatmates" },
    { icon: Trophy, text: "Gamified task tracking" },
    { icon: Sparkles, text: "AI-powered fair distribution" },
  ];

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 relative overflow-hidden">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-blue-600" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        
        {/* Floating decorative elements */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[10%] w-64 h-64 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[5%] w-80 h-80 rounded-full bg-white/10 blur-3xl"
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-[0.05]" />
        
        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <Logo size="md" variant="gradient" className="text-white" />
          </Link>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Living together, <br />
              <span className="text-white/80">made beautiful.</span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Join thousands of students managing their shared spaces with fairness and fun.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-6"
        >
          <div className="flex items-center gap-2 text-sm text-white/60 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Secure & Private
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            <Zap className="h-4 w-4 text-yellow-300" />
            2 Min Setup
          </div>
        </motion.div>
      </div>

      {/* Right Column - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] space-y-8 relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/">
              <Logo size="md" variant="gradient" />
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-3 text-center lg:text-left">
            <motion.h1 
              key={authMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight"
            >
              {isForgotPassword ? "Reset Password" : (hostelName ? "Create Your Hostel" : (isLogin ? "Welcome back" : "Create account"))}
            </motion.h1>
            <p className="text-muted-foreground">
              {isForgotPassword 
                ? "Enter your email to receive a reset link" 
                : (isLogin ? "Sign in to continue to HostelMate" : "Start your journey with HostelMate")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="username" required>Username</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-11 h-12 rounded-xl"
                      required={isSignup}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" required>Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" required>Password</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot-password'); setError(""); }}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isSignup && (
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                )}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-xl font-medium border border-destructive/20"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-bold" 
              variant="glow"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? "Send Reset Link" : (isLogin ? "Sign In" : "Create Account")}
                  {!loading && !isForgotPassword && <ArrowRight className="ml-2 h-5 w-5" />}
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          {!isForgotPassword && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-semibold">
                  {isLogin ? "New to HostelMate?" : "Already have an account?"}
                </span>
              </div>
            </div>
          )}

          {!isForgotPassword && (
            <Button
              variant="outline"
              onClick={toggleMode}
              className="w-full h-12 rounded-xl font-semibold"
            >
              {isLogin ? "Create an account" : "Sign in instead"}
            </Button>
          )}

          {isForgotPassword && (
            <Button
              variant="ghost"
              onClick={() => setAuthMode('login')}
              className="w-full h-12 rounded-xl font-semibold"
            >
              ← Back to login
            </Button>
          )}

          {/* Google Login */}
          {!isForgotPassword && (
            <div className="pt-2">
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
                className="w-full h-12 rounded-xl font-semibold gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          )}

          {/* Terms */}
          {isSignup && (
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline font-medium">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground font-medium">Loading...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
