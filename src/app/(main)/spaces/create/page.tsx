"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Home, Sparkles, Copy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Confetti } from "@/components/Confetti";
import { toast } from "sonner";

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create space');
      setLoading(false);
    }
  };

  if (createdSpace) {
    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdSpace.invite_code}`;
    return (
      <div className="space-y-8 py-8">
        {showConfetti && <Confetti />}
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-green-500/10 flex items-center justify-center mb-4">
            <Sparkles className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold">Hostel Created!</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Your independent hostel <strong>{createdSpace.name}</strong> is ready. Share the link below to add members.
          </p>
        </div>

        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Invite Your Residents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Invite Link</p>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="bg-muted font-mono text-xs" />
                <Button onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  toast.success("Link copied!");
                }}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Invite Code</p>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                <code className="text-3xl font-black tracking-[0.2em] text-primary">{createdSpace.invite_code}</code>
                <Button variant="ghost" size="icon" onClick={() => {
                  navigator.clipboard.writeText(createdSpace.invite_code);
                  toast.success("Code copied!");
                }}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <Button asChild className="w-full h-12 text-lg font-bold rounded-xl">
              <Link href="/">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to create a space</p>
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
        <h1 className="text-2xl font-bold">Create Space</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center">Create Your Space</CardTitle>
          <CardDescription className="text-center">
            A space is where you and your flatmates manage duties together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Space Name</label>
              <Input
                placeholder="e.g., Apartment 4B, Our Flat, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Creating..."
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Space
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        After creating, you'll get an invite code to share with flatmates.
      </p>
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

