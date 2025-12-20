"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowRight, CheckCircle, Trophy, Sparkles, Plus, Users, Flame, TrendingUp, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, SpaceMember, Profile, TASK_CATEGORIES, getDifficultyLabel } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { RecommendedTasks } from "@/components/RecommendedTasks";
import { FlatmatesList } from "@/components/FlatmatesList";
import { useCelebration } from "@/components/Celebrations";
import { StreakBadge, PointsCounter, LevelProgress, calculateLevel } from "@/components/Achievements";
import { SlideInCard, ProgressRing, AnimatedList } from "@/components/Animations";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/Toast";
import { Home } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Dashboard() {
  const { user, profile, currentSpace, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, goal: 5 });
  const { celebrate, CelebrationComponent } = useCelebration();

  useEffect(() => {
    if (currentSpace) {
      fetchData();
    }
  }, [currentSpace]);

  const fetchData = async () => {
    if (!currentSpace || !user) return;
    
    setLoading(true);
    
    // Fetch user's pending tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .in('status', ['todo', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(5);
    
    if (tasksData) setTasks(tasksData);
    
    // Fetch leaderboard
    const { data: membersData } = await supabase
      .from('space_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('space_id', currentSpace.id)
      .order('points', { ascending: false })
      .limit(5);
    
    if (membersData) setLeaderboard(membersData as (SpaceMember & { profile: Profile })[]);

    // Fetch weekly completed tasks for progress
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weeklyTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .eq('status', 'done')
      .gte('created_at', weekAgo.toISOString());

    if (weeklyTasks) {
      setWeeklyProgress({ completed: weeklyTasks.length, goal: 5 });
    }

    // TODO: Calculate actual streak from activity log
    setStreak(Math.floor(Math.random() * 7) + 1); // Placeholder
    
    setLoading(false);
  };

  const handleTaskTaken = () => {
    fetchData();
    celebrate('task_taken');
    toast.taskTaken('New task');
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-muted border-t-primary"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-12 text-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-6"
        >
          <Logo size="lg" className="mb-4" />
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground max-w-md mx-auto font-medium">
              The smart way to manage independent hostels and flat houses fairly.
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <Card className="border-2 border-primary/10 shadow-2xl bg-card/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Start Your Hostel Community</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Enter Hostel Name (e.g. Block A)" 
                    className="h-14 pl-12 rounded-2xl text-lg border-primary/20 focus:border-primary transition-all"
                    id="hostel-name-input"
                  />
                </div>
                <Button 
                  size="lg" 
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-purple-600"
                  onClick={() => {
                    const name = (document.getElementById('hostel-name-input') as HTMLInputElement).value;
                    if (name.trim()) {
                      window.location.href = `/login?hostelName=${encodeURIComponent(name)}&mode=signup`;
                    } else {
                      toast.error("Please enter a hostel name");
                    }
                  }}
                >
                  Create & Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-bold">Or</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl border-primary/20" asChild>
                  <Link href="/login?mode=login">Sign In</Link>
                </Button>
                <Button variant="outline" className="h-12 rounded-xl border-primary/20" asChild>
                  <Link href="/spaces/join">Join with Code</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8 text-sm font-bold text-muted-foreground/60"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Independent Hostels</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Fair Task Distribution</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Gamified Leaderboards</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="space-y-6 text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Users className="mx-auto h-16 w-16 text-muted-foreground" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold">No Space Selected</h1>
          <p className="text-muted-foreground mt-2">
            Create a new space or join an existing one to get started.
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 justify-center"
        >
          <Button asChild className="shadow-lg">
            <Link href="/spaces/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Space
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/spaces/join">Join Space</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const userRank = leaderboard.findIndex(m => m.user_id === user.id) + 1;
  const userPoints = leaderboard.find(m => m.user_id === user.id)?.points || 0;
  const userMemberInfo = leaderboard.find(m => m.user_id === user.id);
  const levelInfo = calculateLevel(userPoints);

  return (
    <div className="space-y-6">
      {CelebrationComponent}
      
      {/* Welcome Section */}
      <SlideInCard direction="down" delay={0}>
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Hey, {profile?.full_name || profile?.username || 'there'}! 
                <motion.span
                  animate={{ rotate: [0, 20, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="inline-block ml-2"
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-muted-foreground">
                {currentSpace.name} • {userMemberInfo?.room_number ? `Room ${userMemberInfo.room_number}` : 'No Room Assigned'}
              </p>
            </div>
            {streak > 0 && <StreakBadge streak={streak} />}
          </div>
        </section>
      </SlideInCard>

      {/* Accommodation Info Card */}
      <SlideInCard direction="up" delay={0.05}>
        <Card className="bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Home size={80} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Current Accommodation</p>
                <h2 className="text-3xl font-bold mt-1">
                  {userMemberInfo?.room_number ? `Room ${userMemberInfo.room_number}` : 'Pending Assignment'}
                </h2>
                <div className="flex gap-4 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-primary-foreground/60">Bed</span>
                    <span className="font-semibold">{userMemberInfo?.bed_number || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-primary-foreground/60">Status</span>
                    <span className="font-semibold capitalize">{(userMemberInfo as any)?.status || 'Active'}</span>
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" asChild className="bg-white/20 hover:bg-white/30 border-none text-white">
                <Link href="/profile">View Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Level Progress */}
      <SlideInCard direction="up" delay={0.1}>
        <Card className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-primary/20">
          <CardContent className="pt-4">
            <LevelProgress 
              currentPoints={levelInfo.currentLevelPoints}
              currentLevel={levelInfo.level}
              pointsForNextLevel={levelInfo.pointsForNextLevel}
            />
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2">
        <SlideInCard direction="left" delay={0.15}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Tasks</CardTitle>
              <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length} Pending</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tasks.filter(t => {
                  if (!t.due_date) return false;
                  const due = new Date(t.due_date);
                  const today = new Date();
                  return due.toDateString() === today.toDateString();
                }).length} due today
              </p>
            </CardContent>
          </Card>
        </SlideInCard>

        <SlideInCard direction="right" delay={0.2}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
              <motion.div
                animate={userRank === 1 ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.5, repeat: userRank === 1 ? Infinity : 0, repeatDelay: 2 }}
              >
                <Trophy className={`h-4 w-4 ${userRank === 1 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">#{userRank || '-'}</span>
                {userRank <= 3 && (
                  <span className="text-lg">
                    {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : '🥉'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <PointsCounter points={userPoints} size="sm" /> points
              </p>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>

      {/* Weekly Progress */}
      <SlideInCard direction="up" delay={0.25}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ProgressRing 
                  progress={(weeklyProgress.completed / weeklyProgress.goal) * 100} 
                  size={56} 
                  strokeWidth={6}
                >
                  <Target className="h-5 w-5 text-primary" />
                </ProgressRing>
                <div>
                  <p className="font-medium">Weekly Goal</p>
                  <p className="text-sm text-muted-foreground">
                    {weeklyProgress.completed}/{weeklyProgress.goal} tasks
                  </p>
                </div>
              </div>
              {weeklyProgress.completed >= weeklyProgress.goal && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-2xl"
                >
                  🎯
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Recommended Tasks */}
      <SlideInCard direction="up" delay={0.3}>
        <RecommendedTasks 
          spaceId={currentSpace.id} 
          userId={user.id}
          onTaskTaken={handleTaskTaken}
        />
      </SlideInCard>

      {/* Flatmates Section */}
      <SlideInCard direction="up" delay={0.32}>
        <FlatmatesList spaceId={currentSpace.id} />
      </SlideInCard>

      {/* Your Tasks */}
      {tasks.length > 0 && (
        <SlideInCard direction="up" delay={0.35}>
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Tasks</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {tasks.slice(0, 3).map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TaskCard 
                      task={task} 
                      onUpdate={fetchData}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </SlideInCard>
      )}

      {/* Leaderboard Preview */}
      <SlideInCard direction="up" delay={0.4}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leaderboard">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {leaderboard.slice(0, 3).map((member, index) => (
                  <motion.div 
                    key={member.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      member.user_id === user.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span 
                        whileHover={{ scale: 1.1 }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </motion.span>
                      <div>
                        <p className="font-medium text-sm">
                          {member.profile?.username || member.profile?.full_name || 'User'}
                          {member.user_id === user.id && (
                            <span className="ml-1.5 text-xs text-primary">(You)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">{member.points} pts</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </SlideInCard>

      {/* Quick Actions */}
      <SlideInCard direction="up" delay={0.45}>
        <section>
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                className="h-20 w-full flex-col gap-2 bg-gradient-to-br from-primary/5 to-purple-600/5 hover:from-primary/10 hover:to-purple-600/10 border-primary/20" 
                asChild
              >
                <Link href="/tasks/pick">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Pick a Task</span>
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="h-20 w-full flex-col gap-2" asChild>
                <Link href="/tasks/create">
                  <Plus className="h-5 w-5" />
                  <span>New Task</span>
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </SlideInCard>
    </div>
  );
}
