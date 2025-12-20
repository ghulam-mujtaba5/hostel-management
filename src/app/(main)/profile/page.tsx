"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Settings, User, ChevronRight, Shield, Bell, Moon, Sun, Camera, Award, Palette, Info, Sparkles, Star, Home, Mail, MapPin } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">Please sign in to view your profile and manage your hostel stay.</p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const points = spaceMembership?.points || 0;
  const levelInfo = calculateLevel(points);

  return (
    <div className="space-y-8 pb-24">
      {/* Profile Header */}
      <SlideInCard direction="down" delay={0}>
        <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
          <div className="h-32 bg-gradient-to-br from-primary via-purple-600 to-blue-600 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="h-28 w-28 rounded-[2rem] bg-background flex items-center justify-center p-1 shadow-2xl">
                  <div className="h-full w-full rounded-[1.8rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-black text-white">
                    {(profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()}
                  </div>
                </div>
                <button className="absolute bottom-1 right-1 h-9 w-9 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center border-4 border-background">
                  <Camera className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </div>
          <CardContent className="pt-16 pb-8 text-center">
            {editing ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 max-w-xs mx-auto"
              >
                <div className="space-y-2">
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-center rounded-2xl h-12"
                  />
                  <Input
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-center rounded-2xl h-12"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-2xl"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 rounded-2xl"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">{profile?.full_name || profile?.username || 'User'}</h1>
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5" />
                    Block A
                  </span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="mt-4 rounded-full px-6 font-bold"
                >
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Level & Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SlideInCard direction="left" delay={0.1}>
          <Card className="rounded-[2rem] overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary/5 to-purple-600/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <ProgressRing 
                    progress={(levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100}
                    size={90}
                    strokeWidth={8}
                  >
                    <div className="text-center">
                      <span className="text-2xl font-black text-primary">{levelInfo.level}</span>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Level</p>
                    </div>
                  </ProgressRing>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg border-4 border-background">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Total Experience</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">{points}</span>
                    <span className="text-sm font-bold text-muted-foreground">pts</span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground text-right">
                      {levelInfo.pointsForNextLevel - levelInfo.currentLevelPoints} PTS TO LEVEL {levelInfo.level + 1}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        <SlideInCard direction="right" delay={0.15}>
          <Card className="rounded-[2rem] overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-600/5 to-cyan-600/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Accommodation</p>
                <div className="h-8 w-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Home className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Room</p>
                  <p className="text-2xl font-black">{(spaceMembership as any)?.room_number || 'TBD'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Bed</p>
                  <p className="text-2xl font-black">{(spaceMembership as any)?.bed_number || 'TBD'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>

      {/* Badges */}
      <SlideInCard direction="up" delay={0.2}>
        <Card className="rounded-[2rem] border-none shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Achievements
              </CardTitle>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                {earnedBadges.length}/{Object.keys(BADGES).length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {earnedBadges.map((badgeType) => (
                <motion.div
                  key={badgeType}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="flex-shrink-0"
                >
                  <BadgeDisplay type={badgeType} size="sm" />
                </motion.div>
              ))}
              {earnedBadges.length === 0 && (
                <div className="w-full py-8 text-center border-2 border-dashed rounded-3xl">
                  <p className="text-sm font-medium text-muted-foreground">Complete tasks to earn your first badge!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Settings List */}
      <SlideInCard direction="up" delay={0.25}>
        <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden">
          <CardContent className="p-2">
            <div className="grid gap-1">
              {[
                { href: "/preferences", icon: Settings, color: "blue", title: "Task Preferences", desc: "Customize recommendations" },
                { href: "/spaces", icon: Shield, color: "purple", title: "Manage Spaces", desc: "Switch or join hostel flats" },
                { href: "/fairness-info", icon: Info, color: "green", title: "How It Works", desc: "Our fairness algorithm" },
              ].map((item, i) => (
                <Link 
                  key={i}
                  href={item.href} 
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl bg-${item.color}-600/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                    </div>
                    <div>
                      <span className="font-bold block">{item.title}</span>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}

              {mounted && (
                <button 
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {resolvedTheme === 'dark' ? (
                        <Moon className="h-6 w-6 text-amber-500" />
                      ) : (
                        <Sun className="h-6 w-6 text-amber-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="font-bold block">Appearance</span>
                      <p className="text-xs text-muted-foreground">
                        Currently in {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode
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
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Sign Out */}
      <SlideInCard direction="up" delay={0.3}>
        <div className="px-4 space-y-6">
          <Button 
            variant="destructive" 
            className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-destructive/20"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
          
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              HostelMate v2.0.0
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/30">
              Securely signed in as {user.email}
            </p>
          </div>
        </div>
      </SlideInCard>
    </div>
  );
}
