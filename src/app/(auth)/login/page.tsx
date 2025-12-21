"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Mail, Lock, User, Sparkles, ArrowRight, Wand2, KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

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
      if (!email.trim()) {
        throw new Error("Email is required");
      }

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
      if (!email.trim()) {
        throw new Error("Email is required");
      }

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
      if (!email.trim()) {
        throw new Error("Email is required");
      }
      if (!password) {
        throw new Error("Password is required");
      }

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
        if (!username.trim()) {
          throw new Error("Username is required");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        
        const { data, error } = await signUp(email, password, username);
        if (error) {
          if (error.message?.includes('already registered')) {
            throw new Error('Email is already registered');
          }
          throw error;
        }

        toast.success('Account created!', { description: 'Welcome to the platform!' });

        // If we have a hostelName, create it immediately
        if (hostelName && data.user) {
          // Wait for profile to be created by trigger
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
            // Force create the profile
            await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                username,
                full_name: username,
              })
              .select();
          }

          const { data: space, error: spaceError } = await supabase
            .from('spaces')
            .insert({
              name: hostelName.trim(),
              created_by: data.user.id,
            })
            .select()
            .single();

          if (spaceError) throw spaceError;

          // Add creator as admin member
          const { error: memberError } = await supabase
            .from('space_members')
            .insert({
              space_id: space.id,
              user_id: data.user.id,
              role: 'admin',
              points: 0,
            });

          if (memberError) throw memberError;

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

  const getTitle = () => {
    switch (authMode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
      case 'magic-link': return 'Magic Link Sign In';
    }
  };

  const getDescription = () => {
    if (hostelName) {
      return <span className="text-primary font-semibold">Setting up &quot;{hostelName}&quot;</span>;
    }
    switch (authMode) {
      case 'login': return 'Sign in to manage your hostel duties';
      case 'signup': return 'Join HostelMate to simplify your shared living';
      case 'forgot-password': return 'Enter your email to receive a reset link';
      case 'magic-link': return 'Sign in without a password using email';
    }
  };

  const getIcon = () => {
    switch (authMode) {
      case 'forgot-password': return <KeyRound className="h-10 w-10 text-white" />;
      case 'magic-link': return <Wand2 className="h-10 w-10 text-white" />;
      default: return <Home className="h-10 w-10 text-white" />;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl opacity-50" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center pt-12 pb-6">
            {/* Back button for forgot password and magic link */}
            {(isForgotPassword || isMagicLink) && !emailSent && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={resetToLogin}
                className="absolute top-6 left-6 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                aria-label="Back to login"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            )}

            <div className="flex justify-center mb-8">
              <motion.div
                key={authMode}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg ${
                  isForgotPassword ? 'bg-orange-500 shadow-orange-500/20' :
                  isMagicLink ? 'bg-purple-500 shadow-purple-500/20' :
                  'bg-primary shadow-primary/20'
                }`}
              >
                {getIcon()}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <CardTitle className="text-3xl font-bold tracking-tight">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={authMode}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {getTitle()}
                  </motion.span>
                </AnimatePresence>
              </CardTitle>
              <CardDescription className="text-base font-medium text-muted-foreground px-6">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={authMode}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {getDescription()}
                  </motion.span>
                </AnimatePresence>
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {/* Email sent success state */}
            {emailSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Check Your Email</h3>
                  <p className="text-muted-foreground">
                    We&apos;ve sent a {isForgotPassword ? 'password reset' : 'magic sign-in'} link to:
                  </p>
                  <p className="font-semibold text-primary">{email}</p>
                </div>
                <div className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive it? Check your spam folder or
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setEmailSent(false)}
                    className="rounded-xl"
                  >
                    Try again
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={resetToLogin}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Forgot Password Form */}
                {isForgotPassword && (
                  <form onSubmit={handleForgotPassword} className="grid gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="forgot-email" className="text-sm font-semibold text-foreground ml-1">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground px-1">We&apos;ll send a password reset link to this email</p>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="text-sm font-medium text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/10 flex items-center gap-2"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-base font-semibold shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Send Reset Link
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* Magic Link Form */}
                {isMagicLink && (
                  <form onSubmit={handleMagicLink} className="grid gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="magic-email" className="text-sm font-semibold text-foreground ml-1">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="text-sm font-medium text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/10 flex items-center gap-2"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-purple-500 hover:bg-purple-600 text-base font-semibold shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4" />
                          Send Magic Link
                        </div>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-2">
                      No password needed! We&apos;ll send you a link to sign in instantly.
                    </p>
                  </form>
                )}

                {/* Login/Signup Form */}
                {(isLogin || isSignup) && (
                  <>
                    <form onSubmit={handleSubmit} className="grid gap-5">
                      <AnimatePresence mode="popLayout">
                        {isSignup && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid gap-2"
                          >
                            <Label htmlFor="username" className="text-sm font-semibold text-foreground ml-1">
                              Username <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required={isSignup}
                                minLength={3}
                                maxLength={30}
                                autoComplete="username"
                                className={`h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all ${username.length >= 3 ? 'border-green-500/50 focus:border-green-500' : ''}`}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground px-1">3-30 characters, letters and numbers only</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-foreground ml-1">
                          Email Address <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className={`h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all ${email.includes('@') && email.includes('.') ? 'border-green-500/50 focus:border-green-500' : ''}`}
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-foreground ml-1">
                          Password <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={isSignup ? "new-password" : "current-password"}
                            className={`h-12 pl-12 pr-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all ${password.length >= 6 ? 'border-green-500/50 focus:border-green-500' : ''}`}
                            placeholder={isSignup ? "Create a password (min 6 chars)" : "Enter your password"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {isSignup && (
                          <p className="text-xs text-muted-foreground px-1">Minimum 6 characters required</p>
                        )}
                      </div>

                      {/* Forgot Password Link */}
                      {isLogin && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => { setAuthMode('forgot-password'); setError(""); }}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                      
                      <AnimatePresence>
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-sm font-medium text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/10 flex items-center gap-2"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="space-y-4 pt-4">
                        <Button 
                          type="submit" 
                          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {isLogin ? "Sign In" : "Create Account"}
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          )}
                        </Button>
                      </div>
                    </form>

                    {/* Divider */}
                    {isLogin && (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground font-bold">Or</span>
                          </div>
                        </div>

                        {/* Magic Link Button */}
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => { setAuthMode('magic-link'); setError(""); }}
                          className="w-full h-12 rounded-xl border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50 transition-all"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Sign in with Magic Link
                        </Button>

                        {/* Google Sign In Button */}
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            setLoading(true);
                            setError("");
                            try {
                              const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                  redirectTo: `${window.location.origin}/auth/callback`,
                                  queryParams: {
                                    access_type: 'offline',
                                    prompt: 'consent',
                                  },
                                },
                              });
                              if (error) throw error;
                            } catch (err: any) {
                              console.error('Google sign in error:', err);
                              setError(err.message || "Failed to sign in with Google");
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="w-full h-12 rounded-xl border-red-500/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50 transition-all"
                        >
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </Button>
                      </>
                    )}
                  </>
                )}

                {/* Toggle Login/Signup */}
                {(isLogin || isSignup) && (
                  <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground font-medium">
                      {isLogin ? "New to HostelMate?" : "Already have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => { setAuthMode(isLogin ? 'signup' : 'login'); setError(""); }}
                        className="font-bold text-primary hover:underline transition-all"
                      >
                        {isLogin ? "Create an account" : "Sign in here"}
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
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

