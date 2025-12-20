"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Settings, User, ChevronRight, Shield, Bell, Moon, Sun, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, profile, currentSpace, spaceMembership, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    await supabase
      .from('profiles')
      .update({
        username,
        full_name: fullName,
      })
      .eq('id', user.id);

    await refreshProfile();
    setEditing(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to view your profile</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {(profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Input
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold">{profile?.full_name || profile?.username || 'User'}</h1>
                  <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
                </>
              )}
            </div>
            <Button 
              variant={editing ? "default" : "outline"} 
              size="sm"
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
            >
              {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{spaceMembership?.points || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{spaceMembership?.role || 'Member'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Space */}
      {currentSpace && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentSpace.name}</p>
                <p className="text-xs text-muted-foreground">Code: {currentSpace.invite_code}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/spaces">Switch</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            <Link href="/preferences" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span>Task Preferences</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
            
            <Link href="/spaces" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span>Manage Spaces</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span>Notifications</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button 
        variant="destructive" 
        className="w-full"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>

      {/* Account Info */}
      <p className="text-center text-xs text-muted-foreground">
        Signed in as {user.email}
      </p>
    </div>
  );
}
