"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Trophy, Sparkles, Plus, Target, UserPlus, BookOpen, ListTodo, Home, Scale } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, SpaceMember, Profile } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { RecommendedTasks } from "@/components/RecommendedTasks";
import { DashboardSkeleton } from "@/components/Skeleton";
import { useCelebration } from "@/components/Celebrations";
import { StreakBadge, LevelProgress, calculateLevel } from "@/components/Achievements";
import { SlideInCard, ProgressRing } from "@/components/Animations";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/Toast";
import { WelcomeModal, useWelcomeModal } from "@/components/WelcomeModal";
import { GettingStartedBanner } from "@/components/GettingStartedChecklist";
import { QuickTip } from "@/components/HelpTooltip";
import { LandingPage } from "@/components/LandingPage";

export default function Dashboard() {
  const { user, profile, currentSpace, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<SpaceMember[]>([]);
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
    
    if (membersData) setLeaderboard(membersData);

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

    // TODO: Implement streak calculation from activity log
    // For now, set to 0 as feature is not fully implemented
    setStreak(0);
    
    setLoading(false);
  };

  const handleTaskTaken = () => {
    fetchData();
    celebrate('task_taken');
    toast.taskTaken('New task');
  };

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (!currentSpace) {
    return (
      <div className="container max-w-5xl mx-auto px-4 pt-24 pb-20">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-12"
        >
          <div className="relative inline-block">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/40 mx-auto">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </motion.div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight pt-4">
            Welcome to HostelMate, <span className="text-primary">{profile?.full_name || profile?.username}!</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Let's get you set up! You need to create or join a space to start managing tasks with your flatmates.
          </p>
        </motion.div>

        {/* Quick Tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <QuickTip id="no-space-tip" variant="tip">
            <strong>First time here?</strong> A "Space" is your digital hostel where you and your flatmates can manage tasks together. 
            Create one if you're the first, or ask your flatmates for an invite code!
          </QuickTip>
        </motion.div>

        {/* Main Action Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12"
        >
          <Link href="/spaces/create" className="block group">
            <Card className="h-full border-2 border-primary/20 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent transition-all hover:shadow-xl hover:-translate-y-1 duration-300 rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="p-4 rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">Create a Space</h3>
                  <p className="text-muted-foreground">
                    Start a new community for your hostel. You'll be the admin and can invite others.
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Get a unique invite code</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Manage members & tasks</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Takes under 30 seconds</span>
                  </div>
                </div>

                <Button className="w-full h-12 rounded-xl font-bold gap-2 bg-gradient-to-r from-primary to-purple-600">
                  Create New Space
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/spaces/join" className="block group">
            <Card className="h-full border-2 border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-transparent transition-all hover:shadow-xl hover:-translate-y-1 duration-300 rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="p-4 rounded-2xl bg-purple-500/10 group-hover:scale-110 transition-transform">
                    <UserPlus className="h-8 w-8 text-purple-500" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold uppercase tracking-wide">
                    Have a code?
                  </span>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">Join a Space</h3>
                  <p className="text-muted-foreground">
                    Already have flatmates using HostelMate? Join them with their invite code.
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Enter 6-character code</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Instant access to tasks</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Start earning points immediately</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full h-12 rounded-xl font-bold gap-2 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-500">
                  Join with Code
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="border border-border/50 rounded-[2rem] bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                What Happens After You Join?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-6 pt-0">
              {[
                {
                  icon: <Target className="h-6 w-6 text-blue-500" />,
                  title: "Pick Tasks",
                  description: "Choose tasks that fit your schedule"
                },
                {
                  icon: <Trophy className="h-6 w-6 text-yellow-500" />,
                  title: "Earn Points",
                  description: "Complete tasks to earn rewards"
                },
                {
                  icon: <Scale className="h-6 w-6 text-purple-500" />,
                  title: "Track Fairness",
                  description: "See everyone's contributions"
                }
              ].map((item, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Help link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/guide">
              <BookOpen className="mr-2 h-4 w-4" />
              Need help? Read the User Guide
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const userRank = leaderboard.findIndex(m => m.user_id === user.id) + 1;
  const userPoints = leaderboard.find(m => m.user_id === user.id)?.points || 0;
  const userMemberInfo = leaderboard.find(m => m.user_id === user.id);
  const levelInfo = calculateLevel(userPoints);

  // Welcome modal for first-time users
  const { isOpen: isWelcomeOpen, closeModal: closeWelcome } = useWelcomeModal();

  // Check if profile is complete
  const hasProfile = Boolean(profile?.full_name || profile?.username);
  // Check if user has completed any task (based on points)
  const hasCompletedTask = userPoints > 0;

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Modal for first-time users */}
      <WelcomeModal 
        isOpen={isWelcomeOpen} 
        onClose={closeWelcome}
        username={profile?.full_name || profile?.username || undefined}
      />

      {CelebrationComponent}

      {/* Getting Started Banner for new users */}
      {(!hasProfile || !hasCompletedTask) && (
        <GettingStartedBanner
          hasProfile={hasProfile}
          hasSpace={true}
          hasCompletedTask={hasCompletedTask}
        />
      )}
      
      {/* Welcome & Daily Inspiration */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SlideInCard direction="down" delay={0}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-border/50 shadow-sm">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Welcome back, <br />
                  <span className="text-primary">{profile?.full_name || profile?.username || 'User'}!</span>
                  <motion.span
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    className="inline-block ml-3"
                  >
                    👋
                  </motion.span>
                </h1>
                <p className="text-muted-foreground font-medium flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {currentSpace.name} {userMemberInfo?.room_number && `• Room ${userMemberInfo.room_number}`}
                </p>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-6">
                  <StreakBadge streak={streak} />
                  <div className="h-12 w-[1px] bg-border hidden md:block" />
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Rank</p>
                    <p className="text-2xl font-bold text-primary">#{userRank}</p>
                  </div>
                </div>
              )}
            </div>
          </SlideInCard>
        </div>

        <SlideInCard direction="right" delay={0.1}>
          <Card className="h-full border-0 shadow-sm bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-[2rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={80} className="text-primary" />
            </div>
            <CardContent className="p-8 space-y-4 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                Daily Motivation
              </div>
              <p className="text-lg font-medium leading-relaxed">
                "Small acts, when multiplied by millions of people, can transform the world."
              </p>
              <p className="text-sm text-muted-foreground font-semibold">— Howard Zinn</p>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Level Card */}
        <SlideInCard direction="up" delay={0.15} className="lg:col-span-2">
          <Card className="h-full border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem]">
            <CardContent className="p-8">
              <LevelProgress 
                currentPoints={levelInfo.currentLevelPoints}
                currentLevel={levelInfo.level}
                pointsForNextLevel={levelInfo.pointsForNextLevel}
              />
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Tasks Summary */}
        <SlideInCard direction="up" delay={0.2}>
          <Card className="h-full border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] group hover:border-primary/30 transition-all">
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-4xl font-bold">{tasks.length}</p>
                <p className="text-muted-foreground font-semibold">Pending Tasks</p>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Points Summary */}
        <SlideInCard direction="up" delay={0.25}>
          <Card className="h-full border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] group hover:border-yellow-500/30 transition-all">
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{userPoints}</span>
                  <span className="text-sm font-semibold text-muted-foreground">pts</span>
                </div>
                <p className="text-muted-foreground font-semibold">Total Points</p>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Recommended Tasks */}
          <SlideInCard direction="up" delay={0.3}>
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-bold tracking-tight">Recommended for You</h2>
                <Button variant="ghost" size="sm" className="font-semibold text-primary hover:bg-primary/5" asChild>
                  <Link href="/tasks/pick">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <RecommendedTasks 
                spaceId={currentSpace.id} 
                userId={user.id}
                onTaskTaken={handleTaskTaken}
              />
            </div>
          </SlideInCard>

          {/* Your Active Tasks */}
          {tasks.length > 0 && (
            <SlideInCard direction="up" delay={0.35}>
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-bold tracking-tight">Your Active Tasks</h2>
                  <Button variant="ghost" size="sm" className="font-semibold text-primary hover:bg-primary/5" asChild>
                    <Link href="/tasks">Manage <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
                <div className="grid gap-4">
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
              </div>
            </SlideInCard>
          )}
        </div>

        <div className="space-y-10">
          {/* Weekly Goal */}
          <SlideInCard direction="up" delay={0.4}>
            <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Weekly Goal</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-2">
                <div className="flex items-center gap-8">
                  <ProgressRing 
                    progress={(weeklyProgress.completed / weeklyProgress.goal) * 100} 
                    size={90} 
                    strokeWidth={10}
                  >
                    <Target className="h-6 w-6 text-primary" />
                  </ProgressRing>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{weeklyProgress.completed}/{weeklyProgress.goal}</p>
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Tasks Done</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SlideInCard>

          {/* Leaderboard Preview */}
          <SlideInCard direction="up" delay={0.45}>
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold tracking-tight">Top Contributors</h2>
                <Button variant="ghost" size="sm" className="font-semibold text-primary hover:bg-primary/5" asChild>
                  <Link href="/leaderboard">Full List</Link>
                </Button>
              </div>
              <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {leaderboard.slice(0, 3).map((member, index) => (
                      <motion.div 
                        key={member.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                          member.user_id === user.id ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-white shadow-md shadow-yellow-500/20' :
                            index === 1 ? 'bg-slate-300 text-slate-700' :
                            index === 2 ? 'bg-orange-400 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {member.profile?.username || member.profile?.full_name || 'User'}
                              {member.user_id === user.id && (
                                <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold">You</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">Level {calculateLevel(member.points).level}</p>
                          </div>
                        </div>
                        <span className="font-bold text-primary">{member.points}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </SlideInCard>

          {/* Quick Actions */}
          <SlideInCard direction="up" delay={0.5}>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-28 rounded-[2rem] flex-col gap-3 border-border/50 bg-white dark:bg-slate-900 hover:border-primary/30 hover:bg-primary/5 transition-all group" 
                asChild
              >
                <Link href="/tasks/create">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider">New Task</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="h-28 rounded-[2rem] flex-col gap-3 border-border/50 bg-white dark:bg-slate-900 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group" 
                asChild
              >
                <Link href="/feedback/submit">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-purple-500" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider">Feedback</span>
                </Link>
              </Button>
            </div>
          </SlideInCard>
        </div>
      </div>
    </div>
  );
}
