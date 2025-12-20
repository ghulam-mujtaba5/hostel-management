"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Home, Sparkles, Copy, ArrowRight, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Confetti } from "@/components/Confetti";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SlideInCard } from "@/components/Animations";

function CreateSpaceContent() {
  const { user, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const successId = searchParams.get("id");
  
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [createdSpace, setCreatedSpace] = useState<any>(null);

  useEffect(() => {
    if (successId && user) {
      const fetchCreatedSpace = async () => {
        const { data, error } = await supabase
          .from('spaces')
          .select('*')
          .eq('id', successId)
          .single();
        
        if (data && !error) {
          setCreatedSpace(data);
          setShowConfetti(true);
        }
      };
      fetchCreatedSpace();
    }
  }, [successId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Ensure profile exists (safety check)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
        const { error: createProfileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username,
            full_name: username,
          });
        
        if (createProfileError) {
          throw new Error(`Profile required: ${createProfileError.message}`);
        }
      }

      // Create the space
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert({
          name: name.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('space_members')
        .insert({
          space_id: space.id,
          user_id: user.id,
          role: 'admin',
          points: 0,
        });

      if (memberError) throw memberError;

      // Log activity
      await supabase.from('activity_log').insert({
        space_id: space.id,
        user_id: user.id,
        action: 'created_space',
        details: { name: space.name },
      });

      setShowConfetti(true);
      await refreshSpaces();
      setCurrentSpace(space);
      setCreatedSpace(space);
    } catch (err: any) {
      console.error('Error creating space:', err);
      setError(err.message || err.error_description || 'Failed to create space');
      setLoading(false);
    }
  };

  if (createdSpace) {
    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdSpace.invite_code}`;
    return (
      <div className="max-w-2xl mx-auto space-y-10 py-12">
        {showConfetti && <Confetti />}
        
        <SlideInCard direction="down">
          <div className="text-center space-y-6">
            <div className="mx-auto h-24 w-24 rounded-[2.5rem] bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/20">
              <ShieldCheck className="h-12 w-12 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Hostel Created!</h1>
              <p className="text-muted-foreground font-bold">
                Your independent hostel <span className="text-primary">"{createdSpace.name}"</span> is ready.
              </p>
            </div>
          </div>
        </SlideInCard>

        <SlideInCard direction="up" delay={0.1}>
          <Card className="border-0 shadow-2xl rounded-[3rem] bg-card/50 backdrop-blur-xl overflow-hidden">
            <div className="bg-primary/5 p-8 border-b border-primary/10">
              <h2 className="text-center text-xs font-black uppercase tracking-[0.2em] text-primary">
                Invite Your Residents
              </h2>
            </div>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Invite Link</p>
                <div className="flex gap-3">
                  <Input 
                    readOnly 
                    value={inviteLink} 
                    className="bg-muted/50 border-0 rounded-2xl h-14 font-mono text-sm focus-visible:ring-0" 
                  />
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      toast.success("Link copied!");
                    }}
                    className="h-14 px-6 rounded-2xl font-black bg-primary hover:scale-105 transition-transform"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Invite Code</p>
                <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20">
                  <code className="text-4xl font-black tracking-[0.3em] text-primary">{createdSpace.invite_code}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      navigator.clipboard.writeText(createdSpace.invite_code);
                      toast.success("Code copied!");
                    }}
                    className="h-12 w-12 rounded-xl hover:bg-primary/10"
                  >
                    <Copy className="h-6 w-6 text-primary" />
                  </Button>
                </div>
              </div>

              <Button asChild className="w-full h-16 text-xl font-black rounded-[1.5rem] bg-gradient-to-r from-primary to-purple-600 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Link href="/">
                  Go to Dashboard
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="h-20 w-20 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-black mb-2">Authentication Required</h2>
        <p className="text-muted-foreground font-medium mb-8">Please sign in to create a new hostel space.</p>
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
            <h1 className="text-3xl font-black tracking-tight">Create Space</h1>
            <p className="text-muted-foreground font-bold">Start your own hostel community</p>
          </div>
        </div>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.1}>
        <Card className="border-0 shadow-2xl rounded-[3rem] bg-card/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center">
            <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6">
              <Home className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black">New Hostel</CardTitle>
            <CardDescription className="text-base font-medium px-6">
              A space is where you and your flatmates manage duties, track points, and maintain fairness.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Space Name</label>
                <Input
                  placeholder="e.g., Apartment 4B, Al-Falah Hostel, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-16 rounded-2xl bg-muted/50 border-0 text-lg font-bold px-6 focus-visible:ring-2 focus-visible:ring-primary"
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
                    Creating...
                  </div>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-6 w-6" />
                    Create Space
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.2}>
        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 text-center">
          <p className="text-sm font-bold text-primary/80">
            💡 After creating, you'll get a unique invite code to share with your flatmates.
          </p>
        </div>
      </SlideInCard>
    </div>
  );
}

export default function CreateSpacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateSpaceContent />
    </Suspense>
  );
}

