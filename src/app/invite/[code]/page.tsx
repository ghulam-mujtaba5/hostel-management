"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Users, UserPlus, Loader2, Mail, Chrome, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Confetti } from "@/components/Confetti";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export default function PublicInvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { user, loading: authLoading, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    fetchSpace();
  }, [code]);

  useEffect(() => {
    // Check if user is already a member when they're logged in
    if (user && space && !authLoading) {
      checkMembership();
    }
  }, [user, space, authLoading]);

  const fetchSpace = async () => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, name, invite_code, created_at')
        .ilike('invite_code', code)
        .single();

      if (error || !data) {
        setError("Invalid or expired invite link. Please ask for a new invite code.");
      } else {
        setSpace(data);
      }
    } catch (err) {
      setError("Failed to load space information.");
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !space) return;
    
    const { data: existingMember } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', space.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      setAlreadyMember(true);
    }
  };

  const handleJoinNow = async () => {
    if (!user || !space) return;

    setJoining(true);
    setError("");

    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('space_members')
        .select('*')
        .eq('space_id', space.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        await refreshSpaces();
        setCurrentSpace(space);
        toast.success(`Welcome back to ${space.name}!`);
        router.push('/');
        return;
      }

      // Add as member
      const { error: joinError } = await supabase
        .from('space_members')
        .insert({
          space_id: space.id,
          user_id: user.id,
          role: 'member',
          points: 0,
        });

      if (joinError) throw joinError;

      // Log activity
      await supabase.from('activity_log').insert({
        space_id: space.id,
        user_id: user.id,
        action: 'joined_space',
        details: { space_name: space.name, via: 'invite_link' },
      });

      setShowConfetti(true);
      await refreshSpaces();
      setCurrentSpace(space);
      toast.success(`You've joined ${space.name}!`);
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to join space.");
      setJoining(false);
    }
  };

  const handleSignUpToJoin = () => {
    // Store invite code in localStorage for after signup
    localStorage.setItem('pendingInviteCode', code.toUpperCase());
    router.push(`/login?mode=signup&invite=${code}&returnTo=/invite/${code}`);
  };

  const handleSignInToJoin = () => {
    localStorage.setItem('pendingInviteCode', code.toUpperCase());
    router.push(`/login?invite=${code}&returnTo=/invite/${code}`);
  };

  const handleGoogleSignIn = async () => {
    localStorage.setItem('pendingInviteCode', code.toUpperCase());
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/invite/${code}`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading invite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-background to-primary/5">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Logo size="sm" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {error ? (
            <Card className="border-0 shadow-2xl rounded-4xl bg-card/80 backdrop-blur-xl">
              <CardContent className="p-10 text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-4xl bg-destructive/10 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black">Invalid Invite</h2>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <div className="space-y-3">
                  <Button asChild className="w-full h-12 rounded-xl font-bold">
                    <Link href="/spaces/join">Enter Code Manually</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/">Go to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-2xl rounded-4xl bg-card/80 backdrop-blur-xl overflow-hidden">
              {/* Invite Header */}
              <div className="bg-linear-to-r from-primary/10 to-purple-600/10 p-8 border-b">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-20 w-20 rounded-4xl bg-white/80 dark:bg-background/80 shadow-lg flex items-center justify-center">
                    <Home className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary/60 mb-2">
                      You're Invited to Join
                    </p>
                    <h1 className="text-3xl font-black tracking-tight">{space?.name}</h1>
                  </div>
                </div>
              </div>

              <CardContent className="p-8 space-y-6">
                {/* User is logged in */}
                {user ? (
                  <div className="space-y-6">
                    {alreadyMember ? (
                      <div className="text-center space-y-4">
                        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                          <p className="text-green-600 dark:text-green-400 font-bold">
                            ✓ You're already a member of this space!
                          </p>
                        </div>
                        <Button 
                          onClick={() => {
                            setCurrentSpace(space);
                            router.push('/');
                          }}
                          className="w-full h-14 text-lg font-black rounded-xl bg-linear-to-r from-primary to-purple-600 shadow-lg"
                        >
                          Go to Dashboard
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-xl text-center">
                          <p className="text-sm text-muted-foreground">
                            Logged in as <span className="font-bold text-foreground">{user.email}</span>
                          </p>
                        </div>
                        <Button 
                          onClick={handleJoinNow}
                          disabled={joining}
                          className="w-full h-14 text-lg font-black rounded-xl bg-linear-to-r from-primary to-purple-600 shadow-lg hover:scale-[1.02] transition-transform"
                        >
                          {joining ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Joining...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-5 w-5 mr-2" />
                              Join {space?.name}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* User is not logged in */
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        Create an account or sign in to join this hostel space
                      </p>
                    </div>

                    {/* Google Sign In - Primary */}
                    <Button 
                      onClick={handleGoogleSignIn}
                      variant="outline"
                      className="w-full h-14 text-lg font-bold rounded-xl border-2 hover:bg-muted/50 hover:scale-[1.02] transition-all"
                    >
                      <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-4 text-muted-foreground font-bold">
                          Or with email
                        </span>
                      </div>
                    </div>

                    {/* Email Sign Up/In */}
                    <div className="space-y-3">
                      <Button 
                        onClick={handleSignUpToJoin}
                        className="w-full h-14 text-lg font-black rounded-xl bg-linear-to-r from-primary to-purple-600 shadow-lg hover:scale-[1.02] transition-transform"
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        Create Account & Join
                      </Button>
                      
                      <Button 
                        onClick={handleSignInToJoin}
                        variant="ghost"
                        className="w-full h-12 font-bold rounded-xl"
                      >
                        Already have an account? Sign In
                      </Button>
                    </div>
                  </div>
                )}

                {/* Invite Code Display */}
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
                    <code className="text-lg font-black tracking-[0.2em] text-primary">
                      {space?.invite_code}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          HostelMate • Smart Duty Management
        </p>
      </footer>
    </div>
  );
}
