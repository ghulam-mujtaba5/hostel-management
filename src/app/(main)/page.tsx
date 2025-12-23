"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, CheckCircle2, Trophy, Plus, Target, 
  LayoutDashboard, Calendar, Users, Settings
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, SpaceMember } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { DashboardSkeleton } from "@/components/Skeleton";
import { motion } from "framer-motion";
import { LandingPage } from "@/components/LandingPage";
import { SmartAssistant } from "@/components/SmartAssistant";
import WellnessWidget from "@/components/WellnessWidget";

export default function Dashboard() {
  const { user, profile, currentSpace, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    points: 0,
    rank: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentSpace) {
      fetchData();
    }
  }, [currentSpace]);

  const fetchData = async () => {
    if (!currentSpace || !user) return;
    setLoading(true);
    
    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
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
      rank: (rankCount || 0) + 1
    });
    
    setLoading(false);
  };

  if (authLoading || loading) return <DashboardSkeleton />;
  if (!user) return <LandingPage />;

  if (!currentSpace) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to HostelMate</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            To get started, you need to join a space or create a new one for your hostel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/spaces/create">
                <Plus className="h-4 w-4" /> Create Space
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/spaces/join">
                <Users className="h-4 w-4" /> Join Space
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your activity in <span className="font-medium text-foreground">{currentSpace.name}</span>
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/tasks/create">
            <Plus className="h-4 w-4" /> New Task
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">{stats.points}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold">#{stats.rank}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SmartAssistant />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Your Tasks</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">View All</Link>
            </Button>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={fetchData} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">You have no pending tasks assigned to you.</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/tasks/pick">Pick a Task</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <WellnessWidget />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/tasks/pick">
                  <Plus className="mr-2 h-4 w-4" /> Pick a Task
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/leaderboard">
                  <Trophy className="mr-2 h-4 w-4" /> View Leaderboard
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/calendar">
                  <Calendar className="mr-2 h-4 w-4" /> Calendar
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
