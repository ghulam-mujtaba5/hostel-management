"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Settings, User, ChevronRight, Shield, Bell, Moon, Sun, Camera, Award, Palette, Info, Sparkles, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard, ProgressRing } from "@/components/Animations";
import { BadgeDisplay, BADGES, BadgeType, PointsCounter, LevelProgress, calculateLevel, StreakBadge } from "@/components/Achievements";
import { toast } from "@/components/Toast";

export default function ProfilePage() {
  const { user, profile, currentSpace, spaceMembership, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Placeholder badges - in production, these would come from the database
  const earnedBadges: BadgeType[] = ['first_task', 'team_player'];
  const streak = 5; // Placeholder

  useEffect(() => {
    setMounted(true);
  }, []);

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
    toast.success('Profile updated!', { emoji: '✅' });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <User className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground">Please sign in to view your profile</p>
          <Button asChild className="mt-4">
            <Link href="/login">Sign In</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const points = spaceMembership?.points || 0;
  const levelInfo = calculateLevel(points);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <SlideInCard direction="down" delay={0}>
        <Card className="overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary to-purple-600" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col items-center -mt-12">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-background shadow-xl">
                  {(profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </motion.div>
              
              <div className="mt-4 text-center w-full">
                {editing ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 max-w-xs mx-auto"
                  >
                    <Input
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="text-center"
                    />
                    <Input
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-center"
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold">{profile?.full_name || profile?.username || 'User'}</h1>
                    <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="mt-2"
                    >
                      Edit Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Level & Points */}
      <SlideInCard direction="up" delay={0.1}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <ProgressRing 
                progress={(levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100}
                size={80}
                strokeWidth={6}
              >
                <div className="text-center">
                  <Star className="h-4 w-4 text-yellow-500 mx-auto" />
                  <span className="text-sm font-bold">{levelInfo.level}</span>
                </div>
              </ProgressRing>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Points</p>
                <PointsCounter points={points} size="lg" />
                <p className="text-xs text-muted-foreground mt-1">
                  {levelInfo.pointsForNextLevel - levelInfo.currentLevelPoints} points to level {levelInfo.level + 1}
                </p>
              </div>
              {streak > 0 && (
                <div className="text-right">
                  <StreakBadge streak={streak} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <SlideInCard direction="left" delay={0.15}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {levelInfo.level}
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
        <SlideInCard direction="right" delay={0.2}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{spaceMembership?.role || 'Member'}</div>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>

      {/* Badges */}
      <SlideInCard direction="up" delay={0.25}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Badges
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {earnedBadges.length}/{Object.keys(BADGES).length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {earnedBadges.map((badgeType) => (
                <motion.div
                  key={badgeType}
                  whileHover={{ scale: 1.1 }}
                  className="flex-shrink-0"
                >
                  <BadgeDisplay type={badgeType} size="sm" />
                </motion.div>
              ))}
              {earnedBadges.length === 0 && (
                <p className="text-sm text-muted-foreground">Complete tasks to earn badges!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Current Space */}
      {currentSpace && (
        <SlideInCard direction="up" delay={0.3}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Space</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentSpace.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Invite code: <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{currentSpace.invite_code}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/spaces">Switch</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
      )}

      {/* Settings List */}
      <SlideInCard direction="up" delay={0.35}>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y dark:divide-gray-800">
              <Link href="/preferences" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="font-medium">Task Preferences</span>
                    <p className="text-xs text-muted-foreground">Customize your task recommendations</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              
              <Link href="/spaces" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="font-medium">Manage Spaces</span>
                    <p className="text-xs text-muted-foreground">Create, join, or switch spaces</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>

              <Link href="/fairness-info" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium">How It Works</span>
                    <p className="text-xs text-muted-foreground">Learn about our fairness algorithm</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>

              {mounted && (
                <button 
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      {resolvedTheme === 'dark' ? (
                        <Moon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Sun className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="font-medium">Appearance</span>
                      <p className="text-xs text-muted-foreground">
                        {resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: resolvedTheme === 'dark' ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Palette className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                </button>
              )}

              <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Notifications</span>
                    <p className="text-xs text-muted-foreground">Manage notification settings</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Sign Out */}
      <SlideInCard direction="up" delay={0.4}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>
      </SlideInCard>

      {/* Account Info */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Signed in as {user.email}
      </p>
    </div>
  );
}
