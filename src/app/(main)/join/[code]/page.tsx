"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Users, UserPlus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Confetti } from "@/components/Confetti";

export default function JoinByLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { user, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchSpace();
  }, [code]);

  const fetchSpace = async () => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('invite_code', code.toUpperCase())
        .single();

      if (error || !data) {
        setError("Invalid or expired invite link.");
      } else {
        setSpace(data);
      }
    } catch (err) {
      setError("Failed to load space information.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !space) {
      router.push(`/login?returnTo=/join/${code}`);
      return;
    }

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

      setShowConfetti(true);
      await refreshSpaces();
      setCurrentSpace(space);
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to join space.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      {showConfetti && <Confetti />}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Home className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">You're Invited!</CardTitle>
            <CardDescription>
              Join the hostel community on HostelMate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="bg-destructive/10 p-4 rounded-xl text-center">
                <p className="text-destructive font-medium">{error}</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/spaces">Go to Spaces</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-6 bg-muted/50 rounded-2xl border border-primary/10">
                  <h3 className="text-xl font-bold text-primary">{space.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Independent Hostel / Flat</p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleJoin} 
                    className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                    disabled={joining}
                  >
                    {joining ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-5 w-5 mr-2" />
                    )}
                    {user ? "Join This Space" : "Sign In to Join"}
                  </Button>
                  
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/spaces">
                      View My Other Spaces
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
