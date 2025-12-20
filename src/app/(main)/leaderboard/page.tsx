"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, TrendingUp, Crown, Star, Flame, Info, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SpaceMember, Profile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { PointsCounter, calculateLevel, LevelProgress, StreakBadge } from "@/components/Achievements";
import { SlideInCard, ProgressRing } from "@/components/Animations";
import Link from "next/link";

export default function LeaderboardPage() {
  const { user, currentSpace } = useAuth();
  const [members, setMembers] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    if (currentSpace) {
      fetchLeaderboard();
    }
  }, [currentSpace, period]);

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
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-black uppercase tracking-wider"
            >
              <Trophy className="h-3 w-3" />
              Hall of Fame
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Community <br />
              <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              Ranking for {currentSpace.name}
            </p>
          </div>

          <div className="flex p-1.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
            {[
              { key: 'all' as const, label: 'All Time' },
              { key: 'month' as const, label: 'Monthly' },
              { key: 'week' as const, label: 'Weekly' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${
                  period === p.key 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
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
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary/40" />
          </div>
          <p className="text-lg font-bold text-muted-foreground animate-pulse">Calculating rankings...</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {topThree.length > 0 && (
            <div className="flex justify-center items-end gap-4 md:gap-8 py-12 px-4 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl -z-10" />
              
              {/* 2nd Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center flex-1 max-w-[120px]"
                >
                  <div className="relative mb-4 group">
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-[2rem] bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-3xl font-black text-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                      {(topThree[1]?.profile?.username?.[0] || topThree[1]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-3 -right-3 h-10 w-10 rounded-2xl bg-card border-2 border-slate-300 flex items-center justify-center text-xl shadow-lg">
                      🥈
                    </div>
                  </div>
                  <p className="font-black text-sm text-center truncate w-full mb-1">
                    {topThree[1]?.profile?.username || 'User'}
                  </p>
                  <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    {topThree[1]?.points} PTS
                  </div>
                  <div className="h-20 w-full bg-gradient-to-t from-slate-200/50 to-transparent dark:from-slate-800/50 rounded-t-3xl mt-6" />
                </motion.div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center flex-1 max-w-[150px] z-10"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative mb-6 group"
                  >
                    <div className="h-28 w-28 md:h-32 md:w-32 rounded-[2.5rem] bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-yellow-500/20 ring-8 ring-yellow-500/10 group-hover:scale-105 transition-transform duration-500">
                      {(topThree[0]?.profile?.username?.[0] || topThree[0]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <motion.div
                      animate={{ rotate: [-15, 15, -15], scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl drop-shadow-2xl"
                    >
                      👑
                    </motion.div>
                    <div className="absolute -bottom-4 -right-4 h-14 w-14 rounded-[1.5rem] bg-card border-4 border-yellow-400 flex items-center justify-center text-3xl shadow-2xl">
                      🥇
                    </div>
                  </motion.div>
                  <p className="font-black text-lg text-center truncate w-full mb-1">
                    {topThree[0]?.profile?.username || 'User'}
                  </p>
                  <div className="px-4 py-1.5 rounded-full bg-yellow-500/10 text-xs font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest border border-yellow-500/20">
                    {topThree[0]?.points} PTS
                  </div>
                  <div className="h-32 w-full bg-gradient-to-t from-yellow-500/20 to-transparent rounded-t-[2.5rem] mt-6 border-x border-t border-yellow-500/10" />
                </motion.div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center flex-1 max-w-[120px]"
                >
                  <div className="relative mb-4 group">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] bg-gradient-to-br from-orange-400 to-amber-700 flex items-center justify-center text-2xl font-black text-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                      {(topThree[2]?.profile?.username?.[0] || topThree[2]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-card border-2 border-orange-500 flex items-center justify-center text-lg shadow-lg">
                      🥉
                    </div>
                  </div>
                  <p className="font-black text-sm text-center truncate w-full mb-1">
                    {topThree[2]?.profile?.username || 'User'}
                  </p>
                  <div className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                    {topThree[2]?.points} PTS
                  </div>
                  <div className="h-16 w-full bg-gradient-to-t from-orange-200/50 to-transparent dark:from-orange-900/20 rounded-t-3xl mt-6" />
                </motion.div>
              )}
            </div>
          )}

          {/* Your Position (if not in top 3) */}
          {userRank > 3 && (
            <SlideInCard direction="up" delay={0.2}>
              <Card className="border-0 shadow-xl bg-primary/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <TrendingUp size={120} />
                </div>
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center font-black text-2xl text-primary-foreground shadow-2xl shadow-primary/40">
                      #{userRank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-2xl tracking-tight">Your Position</h3>
                      <p className="text-muted-foreground font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        You're in the top {Math.round((userRank / members.length) * 100)}% of contributors!
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-primary">
                        {members.find(m => m.user_id === user?.id)?.points || 0}
                      </p>
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideInCard>
          )}

          {/* Full List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Full Rankings</h3>
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <Card className={`border-0 shadow-lg rounded-[2rem] transition-all duration-300 hover:translate-x-2 ${
                        isMe ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-card/50 backdrop-blur-sm hover:bg-card/80'
                      }`}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-10 flex-shrink-0 flex justify-center">
                              {getRankIcon(rank)}
                            </div>
                            
                            <div className="flex-shrink-0 relative">
                              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md ${
                                rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                                rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                                rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                                'bg-gradient-to-br from-primary/40 to-purple-600/40'
                              }`}>
                                {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                              </div>
                              {isMe && (
                                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full border-4 border-background" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <p className="font-black text-lg truncate">
                                  {member.profile?.username || member.profile?.full_name || 'User'}
                                </p>
                                {isMe && (
                                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-black rounded-full uppercase tracking-tighter">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted">
                                  Level {levelInfo.level}
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted">
                                  {member.role}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-2xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                {member.points}
                              </p>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Points</p>
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
        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Info className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">How to climb the ranks?</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  The leaderboard rewards consistency and fairness. Every task you complete contributes to your score and helps maintain the community.
                </p>
                <Button variant="link" asChild className="px-0 h-auto font-black text-primary text-lg">
                  <Link href="/fairness-info">View Fairness Algorithm <ArrowUp className="ml-2 h-5 w-5 rotate-45" /></Link>
                </Button>
              </div>
              <div className="grid gap-4">
                {[
                  { icon: <CheckCircle className="text-green-500" />, title: "Complete Tasks", desc: "Earn points based on difficulty" },
                  { icon: <Star className="text-yellow-500" />, title: "Daily Streaks", desc: "Bonus points for daily activity" },
                  { icon: <Medal className="text-purple-500" />, title: "Quality Work", desc: "Get upvoted for clean results" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50">
                    <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-black text-sm">{item.title}</p>
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

      {/* How Points Work */}
      <SlideInCard direction="up" delay={0.5}>
        <Card className="bg-muted/30 border-none rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3">How Points Work</h3>
                <div className="grid gap-3">
                  {[
                    "Complete tasks to earn points based on difficulty (1-10)",
                    "Harder tasks = more points earned",
                    "System recommends tasks to keep workload fair",
                    "Upload proof photos for task verification"
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
                <Button variant="link" asChild className="px-0 mt-4 h-auto font-bold text-primary">
                  <Link href="/fairness-info">Learn about our fairness algorithm →</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>
    </div>
  );
}
