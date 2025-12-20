"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Confetti } from "@/components/Confetti";

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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to join a space</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti />}
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/spaces">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Join Space</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center">Join a Space</CardTitle>
          <CardDescription className="text-center">
            Enter the invite code shared by your flatmate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Invite Code</label>
              <Input
                placeholder="e.g., abc123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="text-center text-lg tracking-widest uppercase"
                maxLength={10}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Joining..."
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Space
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Ask your flatmate for the invite code from their space settings.
      </p>
    </div>
  );
}
