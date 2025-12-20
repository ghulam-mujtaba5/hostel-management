"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Copy, Check, ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Space } from "@/types";

export default function SpacesPage() {
  const { user, userSpaces, currentSpace, setCurrentSpace, refreshSpaces } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to manage spaces</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Your Spaces</h1>
      </div>

      {/* Space List */}
      {userSpaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't joined any spaces yet</p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/spaces/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Space
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/spaces/join">Join Space</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {userSpaces.map(space => (
            <Card 
              key={space.id}
              className={currentSpace?.id === space.id ? 'ring-2 ring-primary' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{space.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Code: {space.invite_code}
                        </span>
                        <button
                          onClick={() => copyInviteCode(space.invite_code)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copied === space.invite_code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentSpace?.id === space.id ? (
                      <span className="text-xs text-primary font-medium">Active</span>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCurrentSpace(space)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/spaces/${space.id}`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-16" asChild>
          <Link href="/spaces/create">
            <Plus className="mr-2 h-5 w-5" />
            Create
          </Link>
        </Button>
        <Button variant="outline" className="h-16" asChild>
          <Link href="/spaces/join">
            <Users className="mr-2 h-5 w-5" />
            Join
          </Link>
        </Button>
      </div>
    </div>
  );
}
