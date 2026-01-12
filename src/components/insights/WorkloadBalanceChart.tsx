"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, Area, AreaChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, TrendingDown, Scale, AlertCircle, 
  CheckCircle, Activity, Zap, RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import { TASK_CATEGORIES, TaskCategory, Task } from "@/types";
import { cn } from "@/lib/utils";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface WorkloadData {
  userId: string;
  username: string;
  avatarUrl: string | null;
  completedTasks: number;
  points: number;
  avgPointsPerTask: number;
  trend: 'up' | 'down' | 'stable';
  categoryScores: Record<string, number>;
  weeklyProgress: { date: string; tasks: number; points: number }[];
  currentStreak: number;
  maxTasksAllowed: number;
  tasksUntilLimit: number;
}

const MAX_TASKS_PER_WEEK = 10; // Fairness limit

export function WorkloadBalanceChart() {
  const { user, currentSpace } = useAuth();
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const fetchWorkloadData = useCallback(async (showLoading = true) => {
    if (!currentSpace) return;
    
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Fetch members
      const { data: members } = await supabase
        .from('space_members')
        .select('*, profile:profiles(*)')
        .eq('space_id', currentSpace.id);

      // Fetch tasks from last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('space_id', currentSpace.id)
        .eq('status', 'done')
        .gte('completed_at', thirtyDaysAgo.toISOString());

      if (members && tasks) {
        const data: WorkloadData[] = members.map(member => {
          const memberTasks = tasks.filter(t => t.assigned_to === member.user_id);
          const weekTasks = memberTasks.filter(t => 
            new Date(t.completed_at || t.created_at) >= sevenDaysAgo
          );

          // Calculate category scores (for radar chart)
          const categoryScores: Record<string, number> = {};
          Object.keys(TASK_CATEGORIES).forEach(cat => {
            categoryScores[TASK_CATEGORIES[cat as TaskCategory].label] = 
              memberTasks.filter(t => t.category === cat).length;
          });

          // Calculate weekly progress
          const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
          const weeklyProgress = days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = memberTasks.filter(t => 
              (t.completed_at || t.created_at)?.startsWith(dateStr)
            );
            return {
              date: format(day, 'MMM dd'),
              tasks: dayTasks.length,
              points: dayTasks.reduce((sum, t) => sum + (t.difficulty || 1), 0)
            };
          });

          // Calculate trend (compare last 7 days to previous 7 days)
          const lastWeek = memberTasks.filter(t => {
            const date = new Date(t.completed_at || t.created_at);
            return date >= sevenDaysAgo;
          }).length;
          
          const previousWeek = memberTasks.filter(t => {
            const date = new Date(t.completed_at || t.created_at);
            return date < sevenDaysAgo && date >= subDays(sevenDaysAgo, 7);
          }).length;

          const trend: 'up' | 'down' | 'stable' = 
            lastWeek > previousWeek ? 'up' : 
            lastWeek < previousWeek ? 'down' : 'stable';

          // Calculate streak
          let streak = 0;
          const sortedDays = [...days].reverse();
          for (const day of sortedDays) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasTask = memberTasks.some(t => 
              (t.completed_at || t.created_at)?.startsWith(dateStr)
            );
            if (hasTask) streak++;
            else break;
          }

          const totalPoints = memberTasks.reduce((sum, t) => sum + (t.difficulty || 1), 0);
          const avgPoints = memberTasks.length > 0 ? totalPoints / memberTasks.length : 0;

          return {
            userId: member.user_id,
            username: member.profile?.username || member.profile?.full_name || 'Unknown',
            avatarUrl: member.profile?.avatar_url,
            completedTasks: memberTasks.length,
            points: member.points || 0,
            avgPointsPerTask: Math.round(avgPoints * 10) / 10,
            trend,
            categoryScores,
            weeklyProgress,
            currentStreak: streak,
            maxTasksAllowed: MAX_TASKS_PER_WEEK,
            tasksUntilLimit: Math.max(0, MAX_TASKS_PER_WEEK - weekTasks.length)
          };
        });

        setWorkloadData(data.sort((a, b) => b.points - a.points));
        if (user) {
          setSelectedMember(user.id);
        }
      }
    } catch (error) {
      console.error('Error fetching workload data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentSpace, user]);

  // Subscribe to real-time task updates
  useRealtimeSubscription<Task>(
    'tasks',
    useCallback((payload) => {
      if (currentSpace && payload.new.space_id === currentSpace.id) {
        // Refresh workload data when tasks change
        fetchWorkloadData(false);
      }
    }, [currentSpace, fetchWorkloadData]),
    currentSpace ? `space_id=eq.${currentSpace.id}` : undefined
  );

  useEffect(() => {
    if (currentSpace) {
      fetchWorkloadData();
    }
  }, [currentSpace, fetchWorkloadData]);

  const selectedData = workloadData.find(w => w.userId === selectedMember);
  
  // Radar chart data
  const radarData = selectedData 
    ? Object.entries(selectedData.categoryScores).map(([name, value]) => ({
        category: name,
        value,
        fullMark: Math.max(...Object.values(selectedData.categoryScores), 5)
      }))
    : [];

  // Average workload for comparison
  const avgTasks = workloadData.length > 0
    ? Math.round(workloadData.reduce((s, w) => s + w.completedTasks, 0) / workloadData.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          className="rounded-xl gap-2"
          onClick={() => fetchWorkloadData(false)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
      {/* Member Selection */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {workloadData.map((member, index) => (
          <motion.button
            key={member.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedMember(member.userId)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shrink-0",
              selectedMember === member.userId
                ? "bg-primary/10 border-primary text-primary"
                : "bg-muted/30 border-border/50 hover:border-primary/50"
            )}
          >
            <Avatar className="h-6 w-6">
              {member.avatarUrl ? (
                <AvatarImage src={member.avatarUrl} />
              ) : (
                <AvatarFallback className="text-xs">{member.username[0]}</AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm font-medium">{member.username}</span>
            {member.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
            {member.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          </motion.button>
        ))}
      </div>

      {selectedData && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      selectedData.completedTasks >= avgTasks 
                        ? "bg-green-500/20" 
                        : "bg-yellow-500/20"
                    )}>
                      <Activity className={cn(
                        "h-5 w-5",
                        selectedData.completedTasks >= avgTasks 
                          ? "text-green-500" 
                          : "text-yellow-500"
                      )} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedData.completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Tasks Done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedData.avgPointsPerTask}</p>
                      <p className="text-xs text-muted-foreground">Avg Points/Task</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      selectedData.currentStreak >= 3 
                        ? "bg-orange-500/20" 
                        : "bg-muted"
                    )}>
                      <span className="text-xl">🔥</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedData.currentStreak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className={cn(
                "border-border/50",
                selectedData.tasksUntilLimit <= 2 && "border-yellow-500/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      selectedData.tasksUntilLimit <= 2 
                        ? "bg-yellow-500/20" 
                        : "bg-blue-500/20"
                    )}>
                      <Scale className={cn(
                        "h-5 w-5",
                        selectedData.tasksUntilLimit <= 2 
                          ? "text-yellow-500" 
                          : "text-blue-500"
                      )} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedData.tasksUntilLimit}</p>
                      <p className="text-xs text-muted-foreground">Tasks Left/Week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Fairness Warning */}
          {selectedData.tasksUntilLimit <= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">
                        Weekly Limit Approaching
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedData.username} has done {selectedData.maxTasksAllowed - selectedData.tasksUntilLimit} tasks 
                        this week. To ensure fair distribution, they can take {selectedData.tasksUntilLimit} more 
                        task{selectedData.tasksUntilLimit !== 1 ? 's' : ''} this week.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Activity Trend */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Activity Trend
                </CardTitle>
                <CardDescription>Tasks completed over the last 2 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={selectedData.weeklyProgress} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tasks" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTasks)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Radar */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Category Balance
                </CardTitle>
                <CardDescription>Distribution across task categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fontSize: 10 }}
                    />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Radar
                      name={selectedData.username}
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Comparison Bar */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Team Comparison</CardTitle>
          <CardDescription>How everyone compares in task completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workloadData.map((member, index) => {
              const maxTasks = Math.max(...workloadData.map(w => w.completedTasks), 1);
              const percentage = (member.completedTasks / maxTasks) * 100;
              const isSelected = member.userId === selectedMember;
              const isOverAverage = member.completedTasks >= avgTasks;
              
              return (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer",
                    isSelected 
                      ? "bg-primary/5 border-primary/30" 
                      : "border-border/30 hover:border-primary/20"
                  )}
                  onClick={() => setSelectedMember(member.userId)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} />
                      ) : (
                        <AvatarFallback className="text-xs">{member.username[0]}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium flex-1">{member.username}</span>
                    <div className="flex items-center gap-2">
                      {isOverAverage ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-bold">{member.completedTasks} tasks</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.2 + index * 0.03, duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        isOverAverage ? "bg-green-500" : "bg-yellow-500"
                      )}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Average Line */}
          <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-0.5 w-8 bg-muted-foreground/30" />
            <span>Average: {avgTasks} tasks</span>
            <div className="h-0.5 w-8 bg-muted-foreground/30" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
