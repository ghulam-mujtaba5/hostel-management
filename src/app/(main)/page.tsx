"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, CheckCircle2, Trophy, Plus, Target, 
  LayoutDashboard, Calendar, Users, Settings, Flame,
  TrendingUp, Clock, Sparkles, ChevronRight, LogIn, UserPlus,
  Shield, Zap, Award
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, SpaceMember } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { DashboardSkeleton } from "@/components/Skeleton";
import { motion } from "framer-motion";
import { MotivationWidget } from "@/components/MotivationWidget";
import { MemberAccountability } from "@/components/MemberAccountability";
import { IslamicQuoteCard } from "@/components/IslamicQuote";
import { getTimeBasedGreeting, getDaySpecificMotivation } from "@/lib/quotes";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, currentSpace, spaceMembership, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    points: 0,
    rank: 0,
    streak: 0,
    weeklyCompleted: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is logged in and has a space, fetch data
    if (user && currentSpace) {
      fetchData();
    } else if (user || !authLoading) {
      // Once we have a user OR auth has finished loading, mark as done
      setInitialLoadDone(true);
      setLoading(false);
    }
  }, [user, currentSpace, authLoading]);

  const fetchData = async () => {
    if (!currentSpace || !user) return;
    setLoading(true);
    
    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*),
        creator:profiles!tasks_created_by_fkey(*)
      `)
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .in('status', ['todo', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(3);
    
    if (tasksData) setTasks(tasksData);

    // Fetch stats
    const { count: pendingCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .in('status', ['todo', 'in_progress']);

    const { count: completedCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .eq('status', 'done');

    // Weekly completed tasks
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const { count: weeklyCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .eq('status', 'done')
      .gte('updated_at', weekStart.toISOString());

    const { data: memberData } = await supabase
      .from('space_members')
      .select('points')
      .eq('space_id', currentSpace.id)
      .eq('user_id', user.id)
      .single();

    // Calculate rank
    const { count: rankCount } = await supabase
      .from('space_members')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', currentSpace.id)
      .gt('points', memberData?.points || 0);

    setStats({
      pending: pendingCount || 0,
      completed: completedCount || 0,
      points: memberData?.points || 0,
      rank: (rankCount || 0) + 1,
      streak: Math.floor((memberData?.points || 0) / 10),
      weeklyCompleted: weeklyCount || 0
    });
    
    setLoading(false);
    setInitialLoadDone(true);
  };

  // Only show skeleton on very first load with user and space
  if (user && currentSpace && loading) return <DashboardSkeleton />;

  // Show landing page for non-authenticated users
  if (!user && initialLoadDone) {
    return (
      <div className="min-h-[80vh] flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8 max-w-3xl"
          >
            {/* Bismillah Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-xl md:text-2xl text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
              </p>
              <p className="text-xs text-muted-foreground">
                In the name of Allah, the Most Gracious, the Most Merciful
              </p>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold"
              >
                <Sparkles className="h-4 w-4" />
                Smart & Fair Hostel Management
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                Manage Your Hostel Life with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Barakah</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                HostelMate helps you organize tasks with fairness & justice. 
                <span className="block mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  "The best among you are those most beneficial to others"
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-xl font-bold text-lg gap-2 shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Link href="/login?mode=signup">
                  <UserPlus className="h-5 w-5" />
                  Start Your Journey
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-xl font-bold text-lg gap-2 border-emerald-500/30 hover:bg-emerald-500/5">
                <Link href="/login">
                  <LogIn className="h-5 w-5" />
                  Welcome Back
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid md:grid-cols-3 gap-6 pb-12"
        >
          {[
            {
              icon: Shield,
              title: "Fair & Just Distribution",
              description: "Our algorithm ensures everyone contributes equally. Justice is a core value we uphold.",
              gradient: "from-emerald-500/20 to-teal-500/10"
            },
            {
              icon: Award,
              title: "Excellence (Ihsan)",
              description: "Earn points for quality work. 'Allah loves when you do something, you do it with excellence.'",
              gradient: "from-yellow-500/20 to-orange-500/10"
            },
            {
              icon: Zap,
              title: "Harmony & Teamwork",
              description: "Stay in sync with your flatmates. Together, create a peaceful living environment.",
              gradient: "from-blue-500/20 to-cyan-500/10"
            }
          ].map((feature, i) => (
            <Card key={i} className="border-border/50 rounded-2xl bg-gradient-to-br backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 text-center space-y-4">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto`}>
                  <feature.icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Social Proof / Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pb-8"
        >
          <p className="text-xs text-muted-foreground">
            🕌 Built with Islamic values in mind • 🏠 Perfect for hostel students • ⚡ Free to use
          </p>
        </motion.div>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="h-20 w-20 rounded-3xl bg-linear-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to HostelMate</h1>
            <p className="text-muted-foreground text-sm">
              Join or create a space to start managing tasks with your flatmates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="h-12 px-6 rounded-xl font-bold gap-2">
              <Link href="/spaces/create">
                <Plus className="h-4 w-4" /> Create Space
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 rounded-xl font-bold gap-2">
              <Link href="/spaces/join">
                <Users className="h-4 w-4" /> Join Space
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isAdmin = spaceMembership?.role === 'admin';

  return (
    <div className="space-y-6 pb-24">
      {/* Mobile-optimized Header with Islamic Greeting */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-medium text-muted-foreground"
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </motion.p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">
              {getTimeBasedGreeting()}
            </h1>
            <p className="text-sm text-primary font-medium mt-0.5">
              {profile?.username || profile?.full_name?.split(' ')[0] || 'Friend'}! {getDaySpecificMotivation()}
            </p>
          </div>
          <Button asChild size="sm" className="h-9 rounded-xl font-bold gap-1.5 shadow-sm">
            <Link href="/tasks/create">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Compact Stats Grid - Mobile First */}
      <div className="grid grid-cols-4 gap-2">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card bg-linear-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10"
        >
          <div className="flex flex-col items-center text-center">
            <Target className="h-4 w-4 text-blue-500 mb-1" />
            <p className="text-xl font-bold">{stats.pending}</p>
            <p className="text-[9px] text-muted-foreground font-medium">Pending</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="stat-card bg-linear-to-br from-green-500/10 to-green-600/5 border border-green-500/10"
        >
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mb-1" />
            <p className="text-xl font-bold">{stats.completed}</p>
            <p className="text-[9px] text-muted-foreground font-medium">Done</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card bg-linear-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/10"
        >
          <div className="flex flex-col items-center text-center">
            <Trophy className="h-4 w-4 text-yellow-500 mb-1" />
            <p className="text-xl font-bold">{stats.points}</p>
            <p className="text-[9px] text-muted-foreground font-medium">Points</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="stat-card bg-linear-to-br from-orange-500/10 to-red-500/5 border border-orange-500/10"
        >
          <div className="flex flex-col items-center text-center">
            <Flame className="h-4 w-4 text-orange-500 mb-1" />
            <p className="text-xl font-bold">{stats.streak}</p>
            <p className="text-[9px] text-muted-foreground font-medium">Streak</p>
          </div>
        </motion.div>
      </div>

      {/* Motivation Widget */}
      <MotivationWidget />

      {/* Daily Islamic Quote */}
      <IslamicQuoteCard variant="banner" showRefresh={true} />

      {/* Your Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Your Tasks
          </h2>
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-medium">
            <Link href="/tasks" className="flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {tasks.length > 0 ? (
          <div className="space-y-2.5">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <TaskCard task={task} onUpdate={fetchData} compact />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/60 rounded-2xl">
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">All caught up!</h3>
                <p className="text-xs text-muted-foreground">No pending tasks assigned to you.</p>
              </div>
              <Button variant="outline" size="sm" asChild className="h-9 rounded-xl font-medium">
                <Link href="/tasks/pick">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Pick a Task
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions - Compact for Mobile */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-12 rounded-xl justify-start px-3 font-medium text-sm" asChild>
          <Link href="/tasks/pick">
            <Sparkles className="mr-2 h-4 w-4 text-primary" /> Pick Task
          </Link>
        </Button>
        <Button variant="outline" className="h-12 rounded-xl justify-start px-3 font-medium text-sm" asChild>
          <Link href="/leaderboard">
            <Trophy className="mr-2 h-4 w-4 text-yellow-500" /> Leaderboard
          </Link>
        </Button>
        <Button variant="outline" className="h-12 rounded-xl justify-start px-3 font-medium text-sm" asChild>
          <Link href="/insights">
            <TrendingUp className="mr-2 h-4 w-4 text-green-500" /> My Stats
          </Link>
        </Button>
        <Button variant="outline" className="h-12 rounded-xl justify-start px-3 font-medium text-sm" asChild>
          <Link href="/team">
            <Users className="mr-2 h-4 w-4 text-blue-500" /> Team
          </Link>
        </Button>
      </div>

      {/* Team Accountability - Admin or All Users can see */}
      <MemberAccountability compact />

      {/* Weekly Summary Card */}
      <Card className="rounded-2xl border-border/50 overflow-hidden bg-linear-to-br from-primary/5 to-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Weekly Progress</p>
                <p className="text-xs text-muted-foreground">
                  {stats.weeklyCompleted} tasks completed this week
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">#{stats.rank}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Your Rank</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
