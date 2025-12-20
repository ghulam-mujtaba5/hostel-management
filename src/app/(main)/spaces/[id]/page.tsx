"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Copy, Check, UserMinus, Crown, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Space, SpaceMember, Profile } from "@/types";

export default function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshSpaces } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSpace();
  }, [id]);

  const fetchSpace = async () => {
    const { data: spaceData } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', id)
      .single();

    if (spaceData) setSpace(spaceData);

    const { data: membersData } = await supabase
      .from('space_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('space_id', id)
      .order('points', { ascending: false });

    if (membersData) setMembers(membersData as (SpaceMember & { profile: Profile })[]);
    setLoading(false);
  };

  const copyInviteCode = () => {
    if (space) {
      navigator.clipboard.writeText(space.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentMember = members.find(m => m.user_id === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Space not found</p>
        <Button asChild className="mt-4">
          <Link href="/spaces">Back to Spaces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/spaces">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{space.name}</h1>
          <p className="text-sm text-muted-foreground">{members.length} members</p>
        </div>
        {isAdmin && (
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Invite Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Invite Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <code className="text-2xl font-bold tracking-widest">{space.invite_code}</code>
            <Button variant="outline" onClick={copyInviteCode}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this code with flatmates to let them join
          </p>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.profile?.username || member.profile?.full_name || 'User'}
                      {member.user_id === user?.id && ' (You)'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {member.role === 'admin' && (
                        <span className="flex items-center gap-1 text-primary">
                          <Crown className="h-3 w-3" /> Admin
                        </span>
                      )}
                      <span>{member.points} points</span>
                    </div>
                  </div>
                </div>
                {isAdmin && member.user_id !== user?.id && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave Space */}
      {!isAdmin && (
        <Button variant="destructive" className="w-full">
          Leave Space
        </Button>
      )}
    </div>
  );
}
