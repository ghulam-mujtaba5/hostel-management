"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Home, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Confetti } from "@/components/Confetti";

export default function CreateSpacePage() {
  const { user, refreshSpaces, setCurrentSpace } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

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
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create space');
      setLoading(false);
    }
  };

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
