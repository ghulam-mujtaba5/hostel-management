"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Task, FairnessStats, TaskRecommendation, TASK_CATEGORIES, getDifficultyColor } from "@/types";
import { calculateTaskRecommendations } from "@/lib/fairness";

interface RecommendedTasksProps {
  spaceId: string;
  userId: string;
  onTaskTaken?: () => void;
}

export function RecommendedTasks({ spaceId, userId, onTaskTaken }: RecommendedTasksProps) {
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [spaceId, userId]);

  const fetchRecommendations = async () => {
    setLoading(true);

    // Fetch available tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', spaceId)
      .is('assigned_to', null)
      .eq('status', 'todo')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!tasks || tasks.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch user's recent tasks
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', spaceId)
      .eq('assigned_to', userId)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch member stats
    const { data: members } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', spaceId);

    const userMember = members?.find(m => m.user_id === userId);

    const userStats: FairnessStats = {
      user_id: userId,
      space_id: spaceId,
      total_points: userMember?.points || 0,
      tasks_completed: recentTasks?.length || 0,
      easy_tasks: recentTasks?.filter(t => t.difficulty <= 3).length || 0,
      medium_tasks: recentTasks?.filter(t => t.difficulty > 3 && t.difficulty <= 6).length || 0,
      hard_tasks: recentTasks?.filter(t => t.difficulty > 6).length || 0,
      avg_difficulty: recentTasks?.reduce((sum, t) => sum + t.difficulty, 0) / (recentTasks?.length || 1) || 0,
      last_task_date: recentTasks?.[0]?.created_at || null,
    };

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

    const recs = calculateTaskRecommendations(
      tasks,
      {
        userId,
        recentTasks: recentTasks || [],
        stats: userStats,
      },
      allStats
    );

    setRecommendations(recs.slice(0, 3));
    setLoading(false);
  };

  const handleTakeTask = async (task: Task) => {
    setTaking(task.id);

    await supabase
      .from('tasks')
      .update({ 
        assigned_to: userId, 
        status: 'in_progress' 
      })
      .eq('id', task.id);

    await supabase.from('activity_log').insert({
      space_id: task.space_id,
      user_id: userId,
      action: 'took_task',
      details: { task_id: task.id, title: task.title },
    });

    setTaking(null);
    onTaskTaken?.();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Recommended for You</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks/pick">
            All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const category = TASK_CATEGORIES[rec.task.category] || TASK_CATEGORIES.other;
          return (
            <Card 
              key={rec.task.id}
              className={index === 0 ? 'border-primary/50 bg-primary/5' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.emoji}</span>
                    <div>
                      <h3 className="font-medium">{rec.task.title}</h3>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(rec.task.difficulty)}`}>
                      +{rec.task.difficulty}
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => handleTakeTask(rec.task)}
                      disabled={taking === rec.task.id}
                    >
                      {taking === rec.task.id ? '...' : 'Take'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
