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
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {currentSpace.name}
          </p>
        </div>
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center"
        >
          <Trophy className="h-8 w-8 text-yellow-500" />
        </motion.div>
      </div>

      {/* Period Filter */}
      <div className="flex p-1 bg-muted/50 rounded-2xl">
        {[
          { key: 'all' as const, label: 'All Time', icon: Star },
          { key: 'month' as const, label: 'Monthly', icon: TrendingUp },
          { key: 'week' as const, label: 'Weekly', icon: Flame },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${
              period === p.key 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <p.icon className={`h-4 w-4 ${period === p.key ? 'text-primary' : ''}`} />
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Calculating rankings...</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {topThree.length > 0 && (
            <div className="flex justify-center items-end gap-2 py-8 px-2">
              {/* 2nd Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center flex-1 max-w-[100px]"
                >
                  <div className="relative mb-3">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg rotate-[-5deg]">
                      {(topThree[1]?.profile?.username?.[0] || topThree[1]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-gray-300 flex items-center justify-center text-lg shadow-sm">
                      🥈
                    </div>
                  </div>
                  <p className="font-bold text-xs text-center truncate w-full">
                    {topThree[1]?.profile?.username || 'User'}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{topThree[1]?.points} pts</p>
                  <div className="h-16 w-full bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl mt-3 shadow-inner" />
                </motion.div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center flex-1 max-w-[120px] z-10"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative mb-4"
                  >
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-yellow-200 dark:ring-yellow-800/30">
                      {(topThree[0]?.profile?.username?.[0] || topThree[0]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <motion.div
                      animate={{ rotate: [-10, 10, -10] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl drop-shadow-md"
                    >
                      👑
                    </motion.div>
                    <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-background border-2 border-yellow-400 flex items-center justify-center text-xl shadow-md">
                      🥇
                    </div>
                  </motion.div>
                  <p className="font-black text-sm text-center truncate w-full">
                    {topThree[0]?.profile?.username || 'User'}
                  </p>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">{topThree[0]?.points} pts</p>
                  <div className="h-24 w-full bg-gradient-to-t from-yellow-400/80 to-yellow-300/80 dark:from-yellow-700/50 dark:to-yellow-600/50 rounded-t-2xl mt-3 shadow-lg border-x border-t border-yellow-400/20" />
                </motion.div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center flex-1 max-w-[100px]"
                >
                  <div className="relative mb-3">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-xl font-bold text-white shadow-lg rotate-[5deg]">
                      {(topThree[2]?.profile?.username?.[0] || topThree[2]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-background border-2 border-orange-400 flex items-center justify-center text-sm shadow-sm">
                      🥉
                    </div>
                  </div>
                  <p className="font-bold text-xs text-center truncate w-full">
                    {topThree[2]?.profile?.username || 'User'}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{topThree[2]?.points} pts</p>
                  <div className="h-12 w-full bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-t-2xl mt-3 shadow-inner" />
                </motion.div>
              )}
            </div>
          )}

          {/* Your Position (if not in top 3) */}
          {userRank > 3 && (
            <SlideInCard direction="up" delay={0.2}>
              <Card className="border-primary/30 bg-primary/5 rounded-3xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center font-black text-primary-foreground shadow-lg shadow-primary/20">
                      #{userRank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg">Your Position</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        {Math.abs(userRank - 3)} spots away from the podium
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">
                        {members.find(m => m.user_id === user?.id)?.points || 0}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideInCard>
          )}

          {/* Full List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Rankings</h3>
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
                    <Card className={`rounded-2xl transition-all duration-300 hover:scale-[1.02] ${getRankBg(rank, isMe)} ${isMe ? 'ring-2 ring-primary/50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 flex-shrink-0 flex justify-center">
                            {getRankIcon(rank)}
                          </div>
                          
                          <div className="flex-shrink-0 relative">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm ${
                              rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                              rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                              rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                              'bg-gradient-to-br from-primary/60 to-purple-600/60'
                            }`}>
                              {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                            </div>
                            {isMe && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-background" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold truncate">
                                {member.profile?.username || member.profile?.full_name || 'User'}
                              </p>
                              {isMe && (
                                <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded-md uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Star className="h-2.5 w-2.5 fill-muted-foreground" />
                                Level {levelInfo.level}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Minus className="h-2.5 w-2.5" />
                                {member.role}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                              {member.points}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">pts</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

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
