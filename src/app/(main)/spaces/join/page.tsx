"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Confetti } from "@/components/Confetti";
import { motion } from "framer-motion";
import { SlideInCard } from "@/components/Animations";

export default function JoinSpacePage() {
  const { user, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Find the space by invite code
      const { data: space, error: findError } = await supabase
        .from('spaces')
        .select('*')
        .eq('invite_code', inviteCode.trim().toLowerCase())
        .single();

      if (findError || !space) {
        throw new Error('Invalid invite code. Please check and try again.');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('space_members')
        .select('*')
        .eq('space_id', space.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this space.');
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
        details: { space_name: space.name },
      });

      setShowConfetti(true);
      await refreshSpaces();
      setCurrentSpace(space);
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      console.error('Error joining space:', err);
      setError(err.message || err.error_description || 'Failed to join space');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="h-20 w-20 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-black mb-2">Authentication Required</h2>
        <p className="text-muted-foreground font-medium mb-8">Please sign in to join a hostel space.</p>
        <Button asChild size="lg" className="rounded-2xl px-10 font-black">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 py-12">
      {showConfetti && <Confetti />}
      
      <SlideInCard direction="down">
        <div className="flex items-center gap-6 mb-8">
          <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-2xl bg-muted/50 hover:bg-muted">
            <Link href="/spaces">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Join Space</h1>
            <p className="text-muted-foreground font-bold">Enter your community code</p>
          </div>
        </div>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.1}>
        <Card className="border-0 shadow-2xl rounded-[3rem] bg-card/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center">
            <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black">Enter Code</CardTitle>
            <CardDescription className="text-base font-medium px-6">
              Enter the unique invite code shared by your hostel flatmate or administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Invite Code</label>
                <Input
                  placeholder="e.g., ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="h-20 rounded-2xl bg-muted/50 border-0 text-3xl font-black text-center tracking-[0.3em] uppercase px-6 focus-visible:ring-2 focus-visible:ring-primary"
                  maxLength={10}
                  required
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-bold text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20"
                >
                  {error}
                </motion.p>
              )}

              <Button 
                type="submit" 
                className="w-full h-16 text-xl font-black rounded-[1.5rem] bg-gradient-to-r from-primary to-purple-600 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining...
                  </div>
                ) : (
                  <>
                    <UserPlus className="mr-3 h-6 w-6" />
                    Join Space
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.2}>
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-purple-600/5 border border-primary/10">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-sm">Need a code?</h4>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Ask your flatmate to go to their Profile or Space settings to find the invite code for your hostel.
              </p>
            </div>
          </div>
        </div>
      </SlideInCard>
    </div>
  );
}
