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
        <Card className="overflow-hidden border-0 shadow-2xl rounded-[3rem] bg-card/50 backdrop-blur-xl">
          <div className="h-48 bg-gradient-to-br from-primary via-purple-600 to-blue-600 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="h-36 w-36 rounded-[2.5rem] bg-background flex items-center justify-center p-1.5 shadow-2xl">
                  <div className="h-full w-full rounded-[2.2rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-5xl font-black text-white overflow-hidden relative group">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      (profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
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
                  className="absolute bottom-2 right-2 h-11 w-11 rounded-2xl bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center border-4 border-background disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
              </motion.div>
            </div>
          </div>
          
          <CardContent className="pt-20 pb-10 text-center">
            {editing ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 max-w-sm mx-auto"
              >
                <div className="grid gap-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-12 rounded-2xl h-14 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-12 rounded-2xl h-14 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl font-bold"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600"
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
                  <h1 className="text-4xl font-black tracking-tight">{profile?.full_name || profile?.username || 'User'}</h1>
                  <p className="text-muted-foreground font-bold flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                    {currentSpace?.name || 'No Space'}
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-widest border border-purple-500/20">
                    Level {levelInfo.level}
                  </div>
                  {streak > 0 && <StreakBadge streak={streak} />}
                </div>

                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => setEditing(true)}
                  className="mt-4 rounded-2xl px-8 font-black shadow-lg hover:scale-105 transition-transform"
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
          <Card className="h-full rounded-[2.5rem] border-0 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <ProgressRing 
                    progress={(levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100}
                    size={120}
                    strokeWidth={10}
                  >
                    <div className="text-center">
                      <span className="text-4xl font-black text-primary">{levelInfo.level}</span>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Level</p>
                    </div>
                  </ProgressRing>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2 h-10 w-10 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-xl border-4 border-background"
                  >
                    <Star className="h-5 w-5 text-white fill-white" />
                  </motion.div>
                </div>
                
                <div className="flex-1 w-full space-y-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Contribution Points</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tighter">{points}</span>
                      <span className="text-lg font-bold text-muted-foreground">Total PTS</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-primary">Progress to Level {levelInfo.level + 1}</span>
                      <span className="text-muted-foreground">{Math.round((levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100)}%</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(levelInfo.currentLevelPoints / levelInfo.pointsForNextLevel) * 100}%` }}
                        className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground text-right uppercase tracking-widest">
                      {levelInfo.pointsForNextLevel - levelInfo.currentLevelPoints} PTS remaining
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        <SlideInCard direction="up" delay={0.15}>
          <Card className="h-full rounded-[2.5rem] border-0 shadow-xl bg-gradient-to-br from-blue-600/10 to-cyan-600/5 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Home size={120} />
            </div>
            <CardContent className="p-8 flex flex-col justify-between h-full relative">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Accommodation</p>
                <h3 className="text-2xl font-black">Current Stay</h3>
              </div>
              
              <div className="grid gap-4">
                <div className="p-4 rounded-2xl bg-background/40 backdrop-blur-md border border-blue-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Room Number</p>
                  <p className="text-3xl font-black text-blue-600">{(spaceMembership as any)?.room_number || 'TBD'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-background/40 backdrop-blur-md border border-blue-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Bed Position</p>
                  <p className="text-3xl font-black text-cyan-600">{(spaceMembership as any)?.bed_number || 'TBD'}</p>
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
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <Award className="h-6 w-6 text-yellow-500" />
                  Achievements
                </h2>
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-black uppercase tracking-widest">
                  {earnedBadges.length} Unlocked
                </span>
              </div>
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm rounded-[2.5rem] p-8">
                <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                  {earnedBadges.map((badgeType) => (
                    <motion.div
                      key={badgeType}
                      whileHover={{ scale: 1.1, y: -10 }}
                      className="flex-shrink-0"
                    >
                      <BadgeDisplay type={badgeType} size="md" />
                    </motion.div>
                  ))}
                  {earnedBadges.length === 0 && (
                    <div className="w-full py-12 text-center border-4 border-dashed border-muted rounded-[2rem]">
                      <Sparkles className="h-12 w-12 text-muted/30 mx-auto mb-4" />
                      <p className="text-lg font-bold text-muted-foreground">Complete tasks to earn your first badge!</p>
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
                  className="group p-6 rounded-[2rem] bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:bg-primary/5 transition-all"
                >
                  <div className={`h-14 w-14 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`h-7 w-7 text-${item.color}-500`} />
                  </div>
                  <h4 className="text-xl font-black mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                </Link>
              ))}
            </div>
          </SlideInCard>
        </div>

        <div className="space-y-8">
          {/* Appearance & Info */}
          <SlideInCard direction="up" delay={0.3}>
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-4">
                <div className="grid gap-2">
                  {mounted && (
                    <button 
                      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                      className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-400/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                          {resolvedTheme === 'dark' ? (
                            <Moon className="h-6 w-6 text-amber-500" />
                          ) : (
                            <Sun className="h-6 w-6 text-amber-500" />
                          )}
                        </div>
                        <div className="text-left">
                          <span className="font-black block">Appearance</span>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                            {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                          </p>
                        </div>
                      </div>
                      <Palette className="h-5 w-5 text-muted-foreground" />
                    </button>
                  )}
                  
                  <Link 
                    href="/fairness-info" 
                    className="flex items-center justify-between p-5 rounded-2xl hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Info className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="text-left">
                        <span className="font-black block">How It Works</span>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Fairness Algorithm</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                className="w-full h-16 rounded-[1.5rem] font-black text-lg shadow-xl shadow-destructive/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-6 w-6" />
                Sign Out
              </Button>
              
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  <Sparkles className="h-3 w-3" />
                  HostelMate v2.0.0
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                  Securely encrypted session
                </p>
              </div>
            </div>
          </SlideInCard>
        </div>
      </div>
    </div>
  );
}
