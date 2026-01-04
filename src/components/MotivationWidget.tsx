"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Flame, Trophy, Target, Zap, Star, ChevronUp,
  TrendingUp, Award, Sparkles, Heart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotivationData {
  streak: number;
  weeklyProgress: number;
  nextMilestone: { points: number; label: string };
  motivationalMessage: string;
  dailyGoal: { current: number; target: number };
  rank: number;
  totalMembers: number;
  isTopPerformer: boolean;
  recentAchievement: string | null;
}

const MOTIVATIONAL_MESSAGES = [
  // Islamic-inspired messages
  { message: "Every task done well is a form of Ihsan (excellence)! ✨", condition: 'default' },
  { message: "MashaAllah! You're on fire! Keep that streak going! 🔥", condition: 'streak' },
  { message: "Almost there! Barakah awaits at the next level! ⭐", condition: 'close-to-milestone' },
  { message: "Bismillah! Great start today! You've got this! 💪", condition: 'morning' },
  { message: "JazakAllah! You're a top contributor! 🙏", condition: 'top-performer' },
  { message: "Time to shine! The best of people benefit others! ✨", condition: 'no-tasks-today' },
  { message: "Consistency is beloved to Allah! You're doing amazing! 🎯", condition: 'consistent' },
  { message: "SubhanAllah! Your efforts make everyone's life better! 🌟", condition: 'default' },
  { message: "Cleanliness is half of faith! Keep it up! 🏠", condition: 'default' },
  { message: "Alhamdulillah for the energy to serve! 🤲", condition: 'default' },
];

export function MotivationWidget() {
  const { user, currentSpace } = useAuth();
  const [data, setData] = useState<MotivationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (currentSpace && user) {
      fetchMotivationData();
    }
  }, [currentSpace, user]);

  const fetchMotivationData = async () => {
    if (!currentSpace || !user) return;

    try {
      // Fetch user's points and tasks
      const { data: memberData } = await supabase
        .from('space_members')
        .select('points')
        .eq('space_id', currentSpace.id)
        .eq('user_id', user.id)
        .single();

      // Fetch today's completed tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', currentSpace.id)
        .eq('assigned_to', user.id)
        .eq('status', 'done')
        .gte('updated_at', today.toISOString());

      // Fetch this week's completed tasks
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const { count: weekTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', currentSpace.id)
        .eq('assigned_to', user.id)
        .eq('status', 'done')
        .gte('updated_at', weekStart.toISOString());

      // Calculate rank
      const { data: allMembers } = await supabase
        .from('space_members')
        .select('user_id, points')
        .eq('space_id', currentSpace.id)
        .order('points', { ascending: false });

      const rank = (allMembers?.findIndex(m => m.user_id === user.id) || 0) + 1;
      const totalMembers = allMembers?.length || 1;
      const isTopPerformer = rank <= Math.ceil(totalMembers * 0.2); // Top 20%

      // Calculate streak (simplified)
      const points = memberData?.points || 0;
      const streak = Math.floor(points / 10); // Simplified streak calculation

      // Determine milestone
      const milestones = [
        { points: 50, label: 'Rising Star' },
        { points: 100, label: 'Task Master' },
        { points: 200, label: 'Champion' },
        { points: 500, label: 'Legend' },
        { points: 1000, label: 'Hall of Fame' },
      ];
      const nextMilestone = milestones.find(m => m.points > points) || milestones[milestones.length - 1];

      // Pick motivational message
      let messageCondition = 'default';
      if (streak >= 5) messageCondition = 'streak';
      else if (nextMilestone.points - points <= 10) messageCondition = 'close-to-milestone';
      else if (isTopPerformer) messageCondition = 'top-performer';
      else if ((todayTasks || 0) === 0) messageCondition = 'no-tasks-today';

      const validMessages = MOTIVATIONAL_MESSAGES.filter(m => 
        m.condition === messageCondition || m.condition === 'default'
      );
      const motivationalMessage = validMessages[Math.floor(Math.random() * validMessages.length)].message;

      setData({
        streak,
        weeklyProgress: weekTasks || 0,
        nextMilestone,
        motivationalMessage,
        dailyGoal: { current: todayTasks || 0, target: 2 },
        rank,
        totalMembers,
        isTopPerformer,
        recentAchievement: isTopPerformer ? 'Top Performer!' : null
      });
    } catch (error) {
      console.error("Error fetching motivation data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const progressToMilestone = Math.min(
    ((data.nextMilestone.points - (data.nextMilestone.points - 50)) / data.nextMilestone.points) * 100,
    100
  );

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden bg-linear-to-br from-primary/5 via-background to-purple-500/5">
      <CardContent className="p-4">
        {/* Main Motivation Message */}
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-linear-to-br from-primary to-purple-500 mb-2">
            {data.streak >= 5 ? (
              <Flame className="h-6 w-6 text-white animate-flame" />
            ) : data.isTopPerformer ? (
              <Trophy className="h-6 w-6 text-white" />
            ) : (
              <Sparkles className="h-6 w-6 text-white" />
            )}
          </div>
          <p className="text-sm font-medium text-foreground leading-snug px-2">
            {data.motivationalMessage}
          </p>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-lg font-bold">{data.streak}</span>
            </div>
            <p className="text-[9px] text-muted-foreground">Day Streak</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Target className="h-3 w-3 text-green-500" />
              <span className="text-lg font-bold">{data.dailyGoal.current}/{data.dailyGoal.target}</span>
            </div>
            <p className="text-[9px] text-muted-foreground">Daily Goal</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="text-lg font-bold">#{data.rank}</span>
            </div>
            <p className="text-[9px] text-muted-foreground">Rank</p>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-yellow-500" />
              Next: {data.nextMilestone.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {data.nextMilestone.points} pts
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-linear-to-r from-primary to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToMilestone}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Recent Achievement Badge */}
        {data.recentAchievement && (
          <motion.div 
            className="mt-3 flex items-center justify-center gap-2 p-2 bg-yellow-500/10 rounded-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
              {data.recentAchievement}
            </span>
          </motion.div>
        )}

        {/* Quick Action */}
        {data.dailyGoal.current < data.dailyGoal.target && (
          <Button 
            asChild 
            className="w-full mt-3 h-10 rounded-xl font-bold bg-linear-to-r from-primary to-purple-500 hover:opacity-90"
          >
            <a href="/tasks/pick">
              <Zap className="h-4 w-4 mr-2" />
              Complete Daily Goal
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
