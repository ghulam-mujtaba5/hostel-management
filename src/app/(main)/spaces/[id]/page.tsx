"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Copy, Check, UserMinus, Crown, Settings, Share2, ClipboardList, Bell, Shuffle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Space, SpaceMember, Profile, SpaceProfile } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshSpaces, setCurrentSpace } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [spaceProfile, setSpaceProfile] = useState<SpaceProfile | null>(null);
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

    // Fetch space profile
    const { data: profileData } = await supabase
      .from('space_profiles')
      .select('*')
      .eq('space_id', id)
      .single();

    if (profileData) setSpaceProfile(profileData);

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

  const copyInviteLink = () => {
    if (space) {
      const link = `${window.location.origin}/join/${space.invite_code}`;
      navigator.clipboard.writeText(link);
      toast.success("Invite link copied to clipboard!");
    }
  };

  const switchToSpace = () => {
    if (space) {
      setCurrentSpace(space);
      toast.success(`Switched to ${space.name}`);
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
    <div className="space-y-6 pb-20">
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
        <Button variant="default" size="sm" onClick={switchToSpace} className="rounded-xl">
          Use This Hostel
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/spaces/${id}/settings`}>
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        )}
      </div>

      {/* Announcement Banner */}
      {spaceProfile?.announcement && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">Announcement</p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">{spaceProfile.announcement}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions for Admin */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <Link href={`/spaces/${id}/admin`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <span className="text-xs font-bold">Manage Members</span>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/spaces/${id}/settings`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Settings className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <span className="text-xs font-bold">Settings</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/tasks/create">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <ClipboardList className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <span className="text-xs font-bold">Create Task</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Invite Code & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Invite Code & Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <code className="text-2xl font-bold tracking-widest bg-muted px-4 py-2 rounded-lg flex-1 text-center">{space.invite_code}</code>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={copyInviteCode} title="Copy Code">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="default" onClick={copyInviteLink} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share Link
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Share the code or the direct link with flatmates to let them join this hostel.
          </p>
        </CardContent>
      </Card>

      {/* Description & Rules */}
      {(spaceProfile?.description || spaceProfile?.rules) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">About This Hostel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {spaceProfile?.description && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Description</p>
                <p className="text-sm">{spaceProfile.description}</p>
              </div>
            )}
            {spaceProfile?.rules && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">House Rules</p>
                <p className="text-sm whitespace-pre-line">{spaceProfile.rules}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                      {member.room_number && <span>• Room {member.room_number}</span>}
                    </div>
                  </div>
                </div>
                {isAdmin && member.user_id !== user?.id && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
                    <Link href={`/spaces/${id}/admin`}>
                      <UserMinus className="h-4 w-4" />
                    </Link>
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
