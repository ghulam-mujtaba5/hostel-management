"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle, Trophy, Sparkles, Plus, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, SpaceMember, Profile, TASK_CATEGORIES, getDifficultyLabel } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { Confetti } from "@/components/Confetti";
import { RecommendedTasks } from "@/components/RecommendedTasks";

export default function Dashboard() {
  const { user, profile, currentSpace, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

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
    
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 text-center py-12">
        <h1 className="text-3xl font-bold">Welcome to HostelMate!</h1>
        <p className="text-muted-foreground">
          Manage your hostel duties fairly and efficiently.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="space-y-6 text-center py-12">
        <Users className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">No Space Selected</h1>
        <p className="text-muted-foreground">
          Create a new space or join an existing one to get started.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/spaces/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Space
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/spaces/join">Join Space</Link>
          </Button>
        </div>
      </div>
    );
  }

  const userRank = leaderboard.findIndex(m => m.user_id === user.id) + 1;
  const userPoints = leaderboard.find(m => m.user_id === user.id)?.points || 0;

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Hey, {profile?.full_name || profile?.username || 'there'}! 👋
        </h1>
        <p className="text-muted-foreground">
          {currentSpace.name} • {tasks.length} pending tasks
        </p>
      </section>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{userRank || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {userPoints} points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Tasks */}
      <RecommendedTasks 
        spaceId={currentSpace.id} 
        userId={user.id}
        onTaskTaken={() => {
          fetchData();
          setShowConfetti(true);
        }}
      />

      {/* Your Tasks */}
      {tasks.length > 0 && (
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
            {tasks.slice(0, 3).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={fetchData}
              />
            ))}
          </div>
        </section>
      )}

      {/* Leaderboard Preview */}
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
                <div 
                  key={member.user_id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    member.user_id === user.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">
                        {member.profile?.username || member.profile?.full_name || 'User'}
                        {member.user_id === user.id && ' (You)'}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">{member.points} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2" asChild>
            <Link href="/tasks/pick">
              <Sparkles className="h-5 w-5" />
              Pick a Task
            </Link>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" asChild>
            <Link href="/tasks/create">
              <Plus className="h-5 w-5" />
              New Task
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
