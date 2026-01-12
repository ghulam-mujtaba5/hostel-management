"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import { TaskDistributionChart } from "./TaskDistributionChart";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { PointsHistoryChart } from "./PointsHistoryChart";
import { TaskStatsChart } from "./TaskStatsChart";
import { WorkloadBalanceChart } from "./WorkloadBalanceChart";
import { TASK_CATEGORIES, TaskCategory, Task } from "@/types";
import { startOfWeek, endOfWeek, format, subDays, eachDayOfInterval } from "date-fns";
import { 
  Loader2, BarChart3, Users, Activity, TrendingUp, 
  Scale, Target, Sparkles, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";

type InsightTab = 'overview' | 'team-stats' | 'workload' | 'personal';

export function InsightsDashboard() {
  const { user, currentSpace } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightTab>('overview');
  const [taskDistribution, setTaskDistribution] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = useCallback(async (showLoading = true) => {
    if (!user || !currentSpace) return;
    
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // 1. Task Distribution by Category
      const { data: tasks } = await supabase
        .from('tasks')
        .select('category, status, difficulty, completed_at, created_at')
        .eq('space_id', currentSpace.id)
        .eq('assigned_to', user.id)
        .eq('status', 'done');

      if (tasks) {
        const distribution = tasks.reduce((acc: any, task) => {
          const category = task.category as TaskCategory;
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(distribution).map(([key, value]) => ({
          name: TASK_CATEGORIES[key as TaskCategory]?.label || key,
          value,
          color: getColorForCategory(TASK_CATEGORIES[key as TaskCategory]?.label || key)
        }));
        setTaskDistribution(chartData);
      }

      // 2. Weekly Activity - using completed_at for accurate data
      const { data: weeklyTasks } = await supabase
        .from('tasks')
        .select('completed_at, created_at, status, difficulty')
        .eq('space_id', currentSpace.id)
        .eq('assigned_to', user.id)
        .gte('completed_at', subDays(new Date(), 7).toISOString());

      if (weeklyTasks) {
        const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
        const activityData = days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = weeklyTasks.filter(t => 
            t.completed_at?.startsWith(dateStr) || 
            (!t.completed_at && t.created_at?.startsWith(dateStr))
          );
          return {
            name: format(day, 'EEE'),
            completed: dayTasks.filter(t => t.status === 'done').length,
            assigned: dayTasks.length,
            points: dayTasks.reduce((sum, t) => sum + (t.difficulty || 1), 0)
          };
        });
        setWeeklyActivity(activityData);
      }

      // 3. Points History from activity log
      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('created_at, details')
        .eq('space_id', currentSpace.id)
        .eq('user_id', user.id)
        .eq('action', 'completed_task')
        .gte('created_at', subDays(new Date(), 7).toISOString())
        .order('created_at', { ascending: true });

      if (activityLog && activityLog.length > 0) {
        const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
        let cumulativePoints = 0;
        const pointsData = days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayActivities = activityLog.filter(a => a.created_at?.startsWith(dateStr));
          const dayPoints = dayActivities.reduce((sum, a) => sum + (a.details?.points || 0), 0);
          cumulativePoints += dayPoints;
          return {
            date: format(day, 'MMM dd'),
            points: cumulativePoints,
            dailyPoints: dayPoints
          };
        });
        setPointsHistory(pointsData);
      } else {
        // Fallback to showing current points distribution
        const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
        const pointsData = days.map((day, i) => ({
          date: format(day, 'MMM dd'),
          points: 0,
          dailyPoints: 0
        }));
        setPointsHistory(pointsData);
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, currentSpace]);

  // Subscribe to real-time task updates
  useRealtimeSubscription<Task>(
    'tasks',
    useCallback((payload) => {
      if (currentSpace && payload.new.space_id === currentSpace.id) {
        // Refresh insights when tasks change
        fetchInsights(false);
      }
    }, [currentSpace, fetchInsights]),
    currentSpace ? `space_id=eq.${currentSpace.id}` : undefined
  );

  useEffect(() => {
    if (user && currentSpace) {
      fetchInsights();
    }
  }, [user, currentSpace, fetchInsights]);

  // Helper to map category names to hex colors for charts
  const getColorForCategory = (name: string) => {
    const colors: Record<string, string> = {
      'Washroom': '#3b82f6', // blue-500
      'Sweeping': '#eab308', // yellow-500
      'Kitchen': '#f97316', // orange-500
      'Trash': '#6b7280', // gray-500
      'Dusting': '#a855f7', // purple-500
      'Laundry': '#ec4899', // pink-500
      'Dishes': '#06b6d4', // cyan-500
      'Other': '#64748b', // slate-500
    };
    return colors[name] || '#cbd5e1';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { key: 'overview' as InsightTab, label: 'Overview', icon: BarChart3 },
    { key: 'team-stats' as InsightTab, label: 'Team Stats', icon: Users },
    { key: 'workload' as InsightTab, label: 'Workload', icon: Scale },
    { key: 'personal' as InsightTab, label: 'My Activity', icon: Activity },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" />
            Analytics
          </div>
          <h2 className="text-2xl font-bold">Task Insights & Fairness</h2>
          <p className="text-muted-foreground text-sm">
            Track performance, workload balance, and task history
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Updated {format(lastUpdated, 'HH:mm')}
              </span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl gap-2"
          onClick={() => fetchInsights(false)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-muted/30 rounded-2xl border border-border/50 overflow-x-auto">
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0",
              activeTab === tab.key
                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Tasks assigned vs completed over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <WeeklyActivityChart data={weeklyActivity} />
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Task Distribution
                  </CardTitle>
                  <CardDescription>Breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskDistributionChart data={taskDistribution} />
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Points Progression
                </CardTitle>
                <CardDescription>Your points growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <PointsHistoryChart data={pointsHistory} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'team-stats' && (
          <motion.div
            key="team-stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TaskStatsChart />
          </motion.div>
        )}

        {activeTab === 'workload' && (
          <motion.div
            key="workload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <WorkloadBalanceChart />
          </motion.div>
        )}

        {activeTab === 'personal' && (
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    My Weekly Activity
                  </CardTitle>
                  <CardDescription>Your task completion pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <WeeklyActivityChart data={weeklyActivity} />
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    My Categories
                  </CardTitle>
                  <CardDescription>Tasks I've completed by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskDistributionChart data={taskDistribution} />
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Points History
                </CardTitle>
                <CardDescription>Track your point accumulation</CardDescription>
              </CardHeader>
              <CardContent>
                <PointsHistoryChart data={pointsHistory} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
