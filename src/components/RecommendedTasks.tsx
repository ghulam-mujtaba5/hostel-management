"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap, Clock, Star, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Task, FairnessStats, TaskRecommendation, TASK_CATEGORIES, getDifficultyColor } from "@/types";
import { calculateTaskRecommendations } from "@/lib/fairness";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RecommendedTasksProps {
  spaceId: string;
  userId: string;
  onTaskTaken?: () => void;
}

export function RecommendedTasks({ spaceId, userId, onTaskTaken }: RecommendedTasksProps) {
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

  const getDifficultyBadge = (difficulty: number) => {
    if (difficulty <= 3) return { label: 'Easy', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    if (difficulty <= 6) return { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    return { label: 'Hard', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse border border-border/50" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem]">
        <CardContent className="py-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground font-medium mb-6 max-w-sm mx-auto">
            No tasks available right now. Create a new task or check back later.
          </p>
          <Button asChild className="rounded-xl h-11 px-6 font-bold">
            <Link href="/tasks/create">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <AnimatePresence mode="popLayout">
        {recommendations.map((rec, index) => {
          const category = TASK_CATEGORIES[rec.task.category] || TASK_CATEGORIES.other;
          const diffBadge = getDifficultyBadge(rec.task.difficulty);
          const isHovered = hoveredId === rec.task.id;
          const isTaking = taking === rec.task.id;
          const isTopPick = index === 0;
          
          return (
            <motion.div
              key={rec.task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredId(rec.task.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Card className={cn(
                "relative overflow-hidden border shadow-sm rounded-2xl transition-all duration-300 group",
                isTopPick 
                  ? "border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5" 
                  : "border-border/50 bg-white dark:bg-slate-900 hover:border-primary/20",
                isHovered && "shadow-md"
              )}>
                {isTopPick && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
                )}
                
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Category Icon */}
                    <motion.div 
                      className={cn(
                        "h-14 w-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all",
                        isTopPick 
                          ? "bg-primary/10" 
                          : "bg-muted/50 group-hover:bg-primary/10"
                      )}
                      animate={isHovered ? { scale: 1.05, rotate: [0, -5, 5, 0] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {category.emoji}
                    </motion.div>
                    
                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isTopPick && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                            <Star className="h-3 w-3 fill-primary" />
                            Top Pick
                          </span>
                        )}
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          diffBadge.color
                        )}>
                          {diffBadge.label}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-base truncate mb-1 group-hover:text-primary transition-colors">
                        {rec.task.title}
                      </h3>
                      
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-primary" />
                        {rec.reason}
                      </p>
                    </div>
                    
                    {/* Points & Action */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">+{rec.task.difficulty}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Points</p>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          size="lg"
                          onClick={() => handleTakeTask(rec.task)}
                          disabled={isTaking}
                          className={cn(
                            "h-12 px-6 rounded-xl font-bold shadow-lg transition-all",
                            isTopPick 
                              ? "bg-gradient-to-r from-primary to-purple-600 shadow-primary/20 hover:shadow-primary/40" 
                              : "shadow-primary/10"
                          )}
                        >
                          {isTaking ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                          ) : (
                            <>
                              Take
                              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
