"use client";

import { useState, useEffect, useRef } from "react";
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile photo updated!');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
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
    <div className="space-y-10 pb-24">
      {/* Profile Header */}
      <SlideInCard direction="down" delay={0}>
        <Card className="overflow-hidden border border-border/50 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900">
          <div className="h-40 bg-primary/5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="h-32 w-32 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center p-1 shadow-xl">
                  <div className="h-full w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl font-bold text-primary overflow-hidden relative group">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      (profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-xl bg-primary text-white shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center border-4 border-white dark:border-slate-900 disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </motion.div>
            </div>
          </div>
          
          <CardContent className="pt-20 pb-8 text-center">
            {editing ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 max-w-sm mx-auto"
              >
                <div className="grid gap-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 rounded-xl h-12 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 rounded-xl h-12 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-11 rounded-xl font-bold"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 h-11 rounded-xl font-bold"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight">{profile?.full_name || profile?.username || 'User'}</h1>
                  <p className="text-muted-foreground font-medium flex items-center justify-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/10">
                    {currentSpace?.name || 'No Space'}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500/5 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/10">
                    Level {levelInfo.level}
                  </div>
                  {streak > 0 && <StreakBadge streak={streak} />}
                </div>

                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="mt-2 rounded-xl px-6 font-bold"
                >
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SlideInCard direction="up" delay={0.1} className="md:col-span-2">
          <Card className="h-full rounded-[2rem] border border-border/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <ProgressRing 
                    progress={(levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100}
                    size={110}
                    strokeWidth={8}
                  >
                    <div className="text-center">
                      <span className="text-3xl font-bold text-primary">{levelInfo.level}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Level</p>
                    </div>
                  </ProgressRing>
                  <div className="absolute -top-1 -right-1 h-8 w-8 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </div>
                </div>
                
                <div className="flex-1 w-full space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Contribution Points</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight">{points}</span>
                      <span className="text-sm font-bold text-muted-foreground">Total PTS</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-primary">Progress to Level {levelInfo.level + 1}</span>
                      <span className="text-muted-foreground">{Math.round((levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100}%` }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground text-right uppercase tracking-wider">
                      {levelInfo.pointsForNextLevel - levelInfo.currentLevelPoints} PTS remaining
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        <SlideInCard direction="up" delay={0.15}>
          <Card className="h-full rounded-[2rem] border border-border/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Home size={100} />
            </div>
            <CardContent className="p-8 flex flex-col justify-between h-full relative">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Accommodation</p>
                <h3 className="text-xl font-bold">Current Stay</h3>
              </div>
              
              <div className="grid gap-3">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Room Number</p>
                  <p className="text-2xl font-bold text-primary">{(spaceMembership as any)?.room_number || 'TBD'}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bed Position</p>
                  <p className="text-2xl font-bold text-primary">{(spaceMembership as any)?.bed_number || 'TBD'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>

      {/* Achievements & Settings */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Badges */}
          <SlideInCard direction="up" delay={0.2}>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Achievements
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider">
                  {earnedBadges.length} Unlocked
                </span>
              </div>
              <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] p-8">
                <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                  {earnedBadges.map((badgeType) => (
                    <motion.div
                      key={badgeType}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="flex-shrink-0"
                    >
                      <BadgeDisplay type={badgeType} size="md" />
                    </motion.div>
                  ))}
                  {earnedBadges.length === 0 && (
                    <div className="w-full py-12 text-center border-2 border-dashed border-muted rounded-2xl">
                      <Sparkles className="h-10 w-10 text-muted/30 mx-auto mb-3" />
                      <p className="text-sm font-bold text-muted-foreground">Complete tasks to earn your first badge!</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </SlideInCard>

          {/* Quick Settings */}
          <SlideInCard direction="up" delay={0.25}>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/preferences", icon: Settings, color: "blue", title: "Task Preferences", desc: "Customize recommendations" },
                { href: "/spaces", icon: Shield, color: "purple", title: "Manage Spaces", desc: "Switch or join hostel flats" },
              ].map((item, i) => (
                <Link 
                  key={i}
                  href={item.href} 
                  className="group p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-border/50 shadow-sm hover:border-primary/30 transition-all"
                >
                  <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <item.icon className={`h-6 w-6 text-primary`} />
                  </div>
                  <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                </Link>
              ))}
            </div>
          </SlideInCard>
        </div>

        <div className="space-y-8">
          {/* Appearance & Info */}
          <SlideInCard direction="up" delay={0.3}>
            <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardContent className="p-2">
                <div className="grid gap-1">
                  {mounted && (
                    <button 
                      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                      className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-amber-400/5 flex items-center justify-center group-hover:rotate-12 transition-transform">
                          {resolvedTheme === 'dark' ? (
                            <Moon className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Sun className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="text-left">
                          <span className="font-bold block text-sm">Appearance</span>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                          </p>
                        </div>
                      </div>
                      <Palette className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  
                  <Link 
                    href="/fairness-info" 
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-green-500/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Info className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="text-left">
                        <span className="font-bold block text-sm">How It Works</span>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Fairness Algorithm</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </SlideInCard>

          {/* Danger Zone */}
          <SlideInCard direction="up" delay={0.35}>
            <div className="space-y-4">
              <Button 
                variant="destructive" 
                className="w-full h-14 rounded-2xl font-bold text-base shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>
              
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  <Sparkles className="h-3 w-3" />
                  HostelMate v2.0.0
                </div>
              </div>
            </div>
          </SlideInCard>
        </div>
      </div>
    </div>
  );
}
