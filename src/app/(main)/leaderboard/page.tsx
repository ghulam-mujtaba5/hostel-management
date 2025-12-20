"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, TrendingUp, Crown, Star, Flame, Info } from "lucide-react";
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select a space first</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-400" />;
    return <span className="h-6 w-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
  };

  const getRankBg = (rank: number, isMe: boolean) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-800';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-700';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/30 border-orange-200 dark:border-orange-800';
    return 'bg-card border-border';
  };

  const topThree = members.slice(0, 3);
  const rest = members.slice(3);
  const userRank = members.findIndex(m => m.user_id === user?.id) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SlideInCard direction="down" delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">{currentSpace.name}</p>
          </div>
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
          >
            <Trophy className="h-8 w-8 text-yellow-500" />
          </motion.div>
        </div>
      </SlideInCard>

      {/* Period Filter */}
      <SlideInCard direction="up" delay={0.05}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all' as const, label: 'All Time', icon: Star },
            { key: 'month' as const, label: 'This Month', icon: TrendingUp },
            { key: 'week' as const, label: 'This Week', icon: Flame },
          ].map(p => (
            <motion.div key={p.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={period === p.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p.key)}
                className={period === p.key ? 'bg-gradient-to-r from-primary to-purple-600' : ''}
              >
                <p.icon className="h-3.5 w-3.5 mr-1.5" />
                {p.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </SlideInCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-8 w-8 border-4 border-muted border-t-primary"
          />
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {topThree.length >= 3 && (
            <SlideInCard direction="up" delay={0.1}>
              <div className="flex justify-center items-end gap-2 py-4">
                {/* 2nd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      {(topThree[1]?.profile?.username?.[0] || topThree[1]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-xl">🥈</span>
                  </div>
                  <p className="font-medium text-sm mt-2 text-center truncate max-w-[80px]">
                    {topThree[1]?.profile?.username || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{topThree[1]?.points} pts</p>
                  <div className="h-16 w-20 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-t-lg mt-2" />
                </motion.div>

                {/* 1st Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative"
                  >
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-yellow-200 dark:ring-yellow-800">
                      {(topThree[0]?.profile?.username?.[0] || topThree[0]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <motion.span
                      animate={{ rotate: [-5, 5, -5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl"
                    >
                      👑
                    </motion.span>
                  </motion.div>
                  <p className="font-bold text-sm mt-2 text-center truncate max-w-[90px]">
                    {topThree[0]?.profile?.username || 'User'}
                    {topThree[0]?.user_id === user?.id && <span className="text-primary ml-1">(You)</span>}
                  </p>
                  <p className="text-sm font-semibold text-primary">{topThree[0]?.points} pts</p>
                  <div className="h-24 w-24 bg-gradient-to-t from-yellow-400 to-yellow-300 dark:from-yellow-700 dark:to-yellow-600 rounded-t-lg mt-2" />
                </motion.div>

                {/* 3rd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                      {(topThree[2]?.profile?.username?.[0] || topThree[2]?.profile?.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-lg">🥉</span>
                  </div>
                  <p className="font-medium text-sm mt-2 text-center truncate max-w-[70px]">
                    {topThree[2]?.profile?.username || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{topThree[2]?.points} pts</p>
                  <div className="h-12 w-16 bg-gradient-to-t from-orange-400 to-orange-300 dark:from-orange-800 dark:to-orange-700 rounded-t-lg mt-2" />
                </motion.div>
              </div>
            </SlideInCard>
          )}

          {/* Your Position (if not in top 3) */}
          {userRank > 3 && (
            <SlideInCard direction="up" delay={0.2}>
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                        #{userRank}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Your Position</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.abs(userRank - 3)} spots away from podium
                      </p>
                    </div>
                    <div className="text-right">
                      <PointsCounter points={members.find(m => m.user_id === user?.id)?.points || 0} />
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideInCard>
          )}

          {/* Full List */}
          <div className="space-y-3">
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
                  <Card className={`${getRankBg(rank, isMe)} ${isMe ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: rank <= 3 ? 10 : 0 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            {getRankIcon(rank)}
                          </motion.div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow ${
                            rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                            rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                            rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                            'bg-gradient-to-br from-primary/60 to-purple-600/60'
                          }`}>
                            {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {member.profile?.username || member.profile?.full_name || 'User'}
                            </p>
                            {isMe && (
                              <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Level {levelInfo.level}</span>
                            <span>•</span>
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            {member.points}
                          </p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* How Points Work */}
      <SlideInCard direction="up" delay={0.5}>
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium mb-2">How Points Work</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete tasks to earn points based on difficulty (1-10)</li>
                  <li>• Harder tasks = more points earned</li>
                  <li>• System recommends tasks to keep workload fair</li>
                  <li>• Upload proof photos for task verification</li>
                </ul>
                <Button variant="link" asChild className="px-0 mt-2 h-auto">
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
