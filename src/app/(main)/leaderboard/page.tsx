"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SpaceMember, Profile } from "@/types";
import { motion } from "framer-motion";

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
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-400" />;
    return <span className="h-6 w-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
    return 'bg-card border-border';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">{currentSpace.name}</p>
        </div>
        <TrendingUp className="h-8 w-8 text-primary" />
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: 'All Time' },
          { key: 'month' as const, label: 'This Month' },
          { key: 'week' as const, label: 'This Week' },
        ].map(p => (
          <Button
            key={p.key}
            variant={period === p.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member, index) => {
            const rank = index + 1;
            const isMe = member.user_id === user?.id;
            
            return (
              <motion.div
                key={member.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${getRankBg(rank)} ${isMe ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getRankIcon(rank)}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                          {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.profile?.username || member.profile?.full_name || 'User'}
                          {isMe && <span className="ml-2 text-xs text-primary">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{member.points}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Fairness Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">How Points Work</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Complete tasks to earn points based on difficulty (1-10)</li>
            <li>• Harder tasks = more points</li>
            <li>• System recommends tasks to keep workload fair</li>
            <li>• Upload proof photos for verification</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
