"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Mail, Lock, User, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

function LoginContent() {
  const searchParams = useSearchParams();
  const hostelName = searchParams.get("hostelName");
  const mode = searchParams.get("mode");
  const returnTo = searchParams.get("returnTo");
  
  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hostelName) {
      setIsLogin(false);
    }
  }, [hostelName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push(returnTo || "/");
      } else {
        if (!username.trim()) {
          throw new Error("Username is required");
        }
        const { data, error } = await signUp(email, password, username);
        if (error) throw error;

        // If we have a hostelName, create it immediately
        if (hostelName && data.user) {
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-primary/20 via-transparent to-transparent blur-3xl opacity-50" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-card/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pt-10 pb-2">
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20"
              >
                <Home className="h-10 w-10 text-white" />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <CardTitle className="text-4xl font-black tracking-tight">
                {isLogin ? "Welcome Back" : "Join the Community"}
              </CardTitle>
              <CardDescription className="text-base font-medium">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isLogin ? 'login' : 'signup'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {hostelName ? (
                      <span className="text-primary font-bold">Setting up "{hostelName}"</span>
                    ) : (
                      isLogin ? "Sign in to manage your hostel" : "Start your journey with HostelMate"
                    )}
                  </motion.span>
                </AnimatePresence>
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="grid gap-5">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid gap-2"
                  >
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={!isLogin}
                        className="h-14 pl-12 rounded-2xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="grid gap-2"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary transition-all"
                  />
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="grid gap-2"
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-14 pl-12 rounded-2xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    placeholder="Password"
                  />
                </div>
              </motion.div>
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-sm font-bold text-destructive bg-destructive/10 p-4 rounded-2xl border border-destructive/20 flex items-center gap-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 pt-2"
              >
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-lg font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-muted-foreground font-bold">Or</span>
                  </div>
                </div>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-primary/10 hover:bg-primary/5 font-bold"
                  onClick={() => router.push('/demo')}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  Try Live Demo
                </Button>
              </motion.div>
            </form>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-center"
            >
              <p className="text-muted-foreground font-medium">
                {isLogin ? "New to HostelMate?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="font-black text-primary hover:text-primary/80 transition-colors"
                >
                  {isLogin ? "Create an account" : "Sign in here"}
                </button>
              </p>
            </motion.div>
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

