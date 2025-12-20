"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, FairnessStats, TaskRecommendation, TASK_CATEGORIES, getDifficultyLabel, getDifficultyColor } from "@/types";
import { calculateTaskRecommendations } from "@/lib/fairness";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/Confetti";
import { toast } from "@/components/Toast";

export default function PickTaskPage() {
  const { user, currentSpace } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (currentSpace && user) {
      fetchRecommendations();
    }
  }, [currentSpace, user]);

  const fetchRecommendations = async () => {
    if (!currentSpace || !user) return;
    
    setLoading(true);

    // Fetch available tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', currentSpace.id)
      .is('assigned_to', null)
      .eq('status', 'todo')
      .order('created_at', { ascending: false });

    // Fetch user's recent tasks
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch all members' stats
    const { data: members } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', currentSpace.id);

    // Calculate user stats from completed tasks
    const { data: userCompletedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', currentSpace.id)
      .eq('assigned_to', user.id)
      .eq('status', 'done');

    const userStats: FairnessStats = {
      user_id: user.id,
      space_id: currentSpace.id,
      total_points: members?.find(m => m.user_id === user.id)?.points || 0,
      tasks_completed: userCompletedTasks?.length || 0,
      easy_tasks: userCompletedTasks?.filter(t => t.difficulty <= 3).length || 0,
      medium_tasks: userCompletedTasks?.filter(t => t.difficulty > 3 && t.difficulty <= 6).length || 0,
      hard_tasks: userCompletedTasks?.filter(t => t.difficulty > 6).length || 0,
      avg_difficulty: userCompletedTasks?.reduce((sum, t) => sum + t.difficulty, 0) / (userCompletedTasks?.length || 1) || 0,
      last_task_date: userCompletedTasks?.[0]?.created_at || null,
    };

    // Build all members stats
    const allStats: FairnessStats[] = members?.map(m => ({
      user_id: m.user_id,
      space_id: m.space_id,
      total_points: m.points,
      tasks_completed: 0,
      easy_tasks: 0,
      medium_tasks: 0,
      hard_tasks: 0,
      avg_difficulty: 0,
      last_task_date: null,
    })) || [];

    // Get user preferences from local storage
    let preferences;
    try {
      const storedPrefs = localStorage.getItem(`prefs_${currentSpace.id}_${user.id}`);
      if (storedPrefs) {
        preferences = JSON.parse(storedPrefs);
      }
    } catch (e) {
      console.error('Failed to parse preferences', e);
    }

    if (tasks && tasks.length > 0) {
      const recs = calculateTaskRecommendations(
        tasks,
        {
          userId: user.id,
          recentTasks: recentTasks || [],
          stats: userStats,
          preferences: preferences ? {
            preferred_categories: preferences.preferred || [],
            avoided_categories: preferences.avoided || []
          } : undefined
        },
        allStats
      );
      setRecommendations(recs);
    }

    setLoading(false);
  };

  const handleTakeTask = async (task: Task) => {
    if (!user) return;
    
    setTaking(task.id);

    const { error } = await supabase.rpc('take_task', { task_id: task.id });
    if (error) {
      setTaking(null);
      // Surface fairness/guardrail messages coming from Postgres
      toast.error(error.message);
      return;
    }

    setShowConfetti(true);
    setTimeout(() => {
      router.push(`/tasks/${task.id}`);
    }, 1500);
  };

  if (!currentSpace) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select a space first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti />}
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pick a Task</h1>
          <p className="text-sm text-muted-foreground">
            Recommended based on fairness & your history
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks available right now!</p>
            <p className="text-sm text-muted-foreground mt-1">
              All tasks are assigned or completed.
            </p>
            <Button asChild className="mt-4">
              <Link href="/tasks/create">Create a Task</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const category = TASK_CATEGORIES[rec.task.category] || TASK_CATEGORIES.other;
            return (
              <Card 
                key={rec.task.id}
                className={index === 0 ? 'ring-2 ring-primary' : ''}
              >
                {index === 0 && (
                  <div className="bg-primary text-primary-foreground px-4 py-1 text-xs font-medium rounded-t-lg">
                    ⭐ Top Recommendation
                  </div>
                )}
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.emoji}</span>
                      <div>
                        <h3 className="font-medium">{rec.task.title}</h3>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(rec.task.difficulty)}`}>
                      +{rec.task.difficulty} pts
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${rec.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(rec.score)}% match
                      </span>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleTakeTask(rec.task)}
                      disabled={taking === rec.task.id}
                    >
                      {taking === rec.task.id ? 'Taking...' : 'Take Task'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
