"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, TrendingUp, Crown, Star, Info, ArrowUp, ArrowDown, CheckCircle, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SpaceMember, Profile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { calculateLevel, LevelProgress } from "@/components/Achievements";
import { SlideInCard, ProgressRing } from "@/components/Animations";
import { EmptyState } from "@/components/EmptyState";
import { LeaderboardSkeleton } from "@/components/Skeleton";
import Link from "next/link";

export default function LeaderboardPage() {
  const { user, currentSpace, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    if (currentSpace && user) {
      fetchLeaderboard();
    } else if (!authLoading) {
      // Clear members when no space or user
      setMembers([]);
      setLoading(false);
    }
  }, [currentSpace?.id, user?.id, period, authLoading]); // Depend on user ID too

  const fetchLeaderboard = async () => {
    if (!currentSpace) return;
    
    setLoading(true);

    const { data } = await supabase
      .from('space_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('space_id', currentSpace.id)
      .order('points', { ascending: false });

    if (data) setMembers(data as (SpaceMember & { profile: Profile })[]);
    setLoading(false);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="space-y-4">
        <LeaderboardSkeleton />
        <LeaderboardSkeleton />
        <LeaderboardSkeleton />
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 max-w-md"
        >
          <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-yellow-400/20 to-amber-500/20 flex items-center justify-center mx-auto">
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Sign In Required</h2>
            <p className="text-muted-foreground font-medium">
              Please sign in to see the leaderboard and compete with your flatmates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="rounded-xl px-8 font-bold gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl px-8 font-bold gap-2">
              <Link href="/login?mode=signup">
                <UserPlus className="h-4 w-4" />
                Create Account
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Space Selected</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">Join a space to see how you rank against your flatmates!</p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/spaces">Select Space</Link>
        </Button>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-400" />;
    return <span className="h-6 w-6 flex items-center justify-center text-muted-foreground font-bold text-sm">{rank}</span>;
  };

  const getRankBg = (rank: number, isMe: boolean) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-800';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-700';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/30 border-orange-200 dark:border-orange-800';
    return isMe ? 'bg-primary/5 border-primary/20' : 'bg-card border-border';
  };

  const topThree = members.slice(0, 3);
  const rest = members.slice(3);
  const userRank = members.findIndex(m => m.user_id === user?.id) + 1;

  return (
    <div className="space-y-10 pb-24">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="space-y-2 min-w-0 flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold uppercase tracking-wider"
            >
              <Trophy className="h-3 w-3" />
              Hall of Fame
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">
              Community <br className="hidden sm:block" />
              <span className="text-primary">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 text-xs sm:text-sm md:text-base truncate">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span className="truncate">Ranking for {currentSpace.name}</span>
            </p>
          </div>

          <div className="flex p-1 bg-muted/30 border border-border/50 rounded-xl overflow-x-auto shrink-0">
            {[
              { key: 'all' as const, label: 'All Time' },
              { key: 'month' as const, label: 'Monthly' },
              { key: 'week' as const, label: 'Weekly' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 sm:px-4 md:px-6 py-2 text-xs md:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                  period === p.key 
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <LeaderboardSkeleton />
          <LeaderboardSkeleton />
          <LeaderboardSkeleton />
          <LeaderboardSkeleton />
          <LeaderboardSkeleton />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No rankings yet"
          description="Start completing tasks to climb the leaderboard!"
          action={{ label: 'Browse Tasks', href: '/tasks' }}
        />
      ) : (
        <>
          {/* Podium for Top 3 */}
          {topThree.length > 0 && (
            <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-12 py-8 sm:py-16 px-2 sm:px-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl -z-10" />
              
              {/* 2nd Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center flex-1 max-w-[100px] sm:max-w-[120px]"
                >
                  <div className="relative mb-2 sm:mb-4 group">
                    <div className="h-14 w-14 sm:h-20 md:h-24 sm:w-20 md:w-24 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl sm:text-3xl font-bold text-slate-400 shadow-lg group-hover:scale-105 transition-transform duration-500">
                      {(topThree[1]?.profile?.username?.[0] || topThree[1]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-base sm:text-xl shadow-md">
                      🥈
                    </div>
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-center truncate w-full mb-1">
                    {topThree[1]?.profile?.username || 'User'}
                  </p>
                  <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {topThree[1]?.points} PTS
                  </div>
                  <div className="h-12 sm:h-20 w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-t-xl sm:rounded-t-2xl mt-3 sm:mt-6 border-x border-t border-slate-200/50 dark:border-slate-700/50" />
                </motion.div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center flex-1 max-w-[120px] sm:max-w-[160px] z-10"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative mb-3 sm:mb-6 group"
                  >
                    <div className="h-20 w-20 sm:h-28 md:h-32 sm:w-28 md:w-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-3xl sm:text-5xl font-bold text-white shadow-2xl shadow-yellow-500/20 ring-4 sm:ring-8 ring-yellow-500/5 group-hover:scale-105 transition-transform duration-500">
                      {(topThree[0]?.profile?.username?.[0] || topThree[0]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <motion.div
                      animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-8 sm:-top-12 left-1/2 -translate-x-1/2 text-3xl sm:text-5xl drop-shadow-xl"
                    >
                      👑
                    </motion.div>
                    <div className="absolute -bottom-3 sm:-bottom-4 -right-3 sm:-right-4 h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border-2 sm:border-4 border-yellow-400 flex items-center justify-center text-xl sm:text-3xl shadow-xl">
                      🥇
                    </div>
                  </motion.div>
                  <p className="font-bold text-sm sm:text-lg text-center truncate w-full mb-1">
                    {topThree[0]?.profile?.username || 'User'}
                  </p>
                  <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-yellow-500/10 text-[10px] sm:text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider border border-yellow-500/20">
                    {topThree[0]?.points} PTS
                  </div>
                  <div className="h-20 sm:h-32 w-full bg-yellow-500/10 rounded-t-2xl sm:rounded-t-3xl mt-3 sm:mt-6 border-x border-t border-yellow-500/20" />
                </motion.div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center flex-1 max-w-[100px] sm:max-w-[120px]"
                >
                  <div className="relative mb-2 sm:mb-4 group">
                    <div className="h-12 w-12 sm:h-16 md:h-20 sm:w-16 md:w-20 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-100 dark:border-orange-900/30 flex items-center justify-center text-lg sm:text-2xl font-bold text-orange-400 shadow-lg group-hover:scale-105 transition-transform duration-500">
                      {(topThree[2]?.profile?.username?.[0] || topThree[2]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 h-6 w-6 sm:h-8 sm:w-8 rounded-md sm:rounded-lg bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center text-sm sm:text-lg shadow-md">
                      🥉
                    </div>
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-center truncate w-full mb-1">
                    {topThree[2]?.profile?.username || 'User'}
                  </p>
                  <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-[8px] sm:text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                    {topThree[2]?.points} PTS
                  </div>
                  <div className="h-10 sm:h-16 w-full bg-orange-50/50 dark:bg-orange-900/10 rounded-t-xl sm:rounded-t-2xl mt-3 sm:mt-6 border-x border-t border-orange-100 dark:border-orange-900/20" />
                </motion.div>
              )}
            </div>
          )}

          {/* Your Position (if not in top 3) */}
          {userRank > 3 && (
            <SlideInCard direction="up" delay={0.2}>
              <Card className="border border-primary/20 shadow-lg bg-primary/5 backdrop-blur-xl rounded-[2rem] overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <TrendingUp size={120} />
                </div>
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-primary/20">
                      #{userRank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-2xl tracking-tight">Your Position</h3>
                      <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        You're in the top {Math.round((userRank / members.length) * 100)}% of contributors!
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-primary">
                        {members.find(m => m.user_id === user?.id)?.points || 0}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideInCard>
          )}

          {/* Full List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Rankings</h3>
              <span className="text-xs font-bold text-muted-foreground">{members.length} Members</span>
            </div>
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {members.map((member, index) => {
                  const rank = index + 1;
                  const isMe = member.user_id === user?.id;
                  const levelInfo = calculateLevel(member.points);
                  
                  return (
                    <motion.div
                      key={member.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <Card className={`border border-border/50 shadow-sm rounded-2xl transition-all duration-300 hover:border-primary/30 ${
                        isMe ? 'bg-primary/5 ring-1 ring-primary/10' : 'bg-white dark:bg-slate-900'
                      }`}>
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-8 flex-shrink-0 flex justify-center">
                              {getRankIcon(rank)}
                            </div>
                            
                            <div className="flex-shrink-0 relative">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm ${
                                rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                                rank === 2 ? 'bg-slate-300' :
                                rank === 3 ? 'bg-orange-400' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-base truncate">
                                  {member.profile?.username || member.profile?.full_name || 'User'}
                                </p>
                                {isMe && (
                                  <span className="px-2 py-0.5 bg-primary text-white text-[8px] font-bold rounded-full uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50">
                                  Level {levelInfo.level}
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50">
                                  {member.role}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                {member.points}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Points</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* Info Section */}
      <SlideInCard direction="up" delay={0.5}>
        <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight">How to climb the ranks?</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  The leaderboard rewards consistency and contribution. Every task you complete helps maintain the community and earns you points.
                </p>
                <Button variant="link" asChild className="px-0 h-auto font-bold text-primary">
                  <Link href="/fairness-info">View Fairness Algorithm <ArrowUp className="ml-1 h-4 w-4 rotate-45" /></Link>
                </Button>
              </div>
              <div className="grid gap-3">
                {[
                  { icon: <CheckCircle className="text-green-500 h-4 w-4" />, title: "Complete Tasks", desc: "Earn points based on difficulty" },
                  { icon: <Star className="text-yellow-500 h-4 w-4" />, title: "Daily Streaks", desc: "Bonus points for daily activity" },
                  { icon: <Medal className="text-purple-500 h-4 w-4" />, title: "Quality Work", desc: "Get recognized for clean results" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>
    </div>
  );
}
