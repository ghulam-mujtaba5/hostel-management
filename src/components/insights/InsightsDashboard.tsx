"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TaskDistributionChart } from "./TaskDistributionChart";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { PointsHistoryChart } from "./PointsHistoryChart";
import { TaskStatsChart } from "./TaskStatsChart";
import { WorkloadBalanceChart } from "./WorkloadBalanceChart";
import { TASK_CATEGORIES, TaskCategory } from "@/types";
import { startOfWeek, endOfWeek, format, subDays, eachDayOfInterval } from "date-fns";
import { 
  Loader2, BarChart3, Users, Activity, TrendingUp, 
  Scale, Target, Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

type InsightTab = 'overview' | 'team-stats' | 'workload' | 'personal';

export function InsightsDashboard() {
  const { user, currentSpace } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InsightTab>('overview');
  const [taskDistribution, setTaskDistribution] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user && currentSpace) {
      fetchInsights();
    }
  }, [user, currentSpace]);

  const fetchInsights = async () => {
    if (!user || !currentSpace) return;
    setLoading(true);

    try {
      // 1. Task Distribution by Category
      const { data: tasks } = await supabase
        .from('tasks')
        .select('category, status')
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
          color: TASK_CATEGORIES[key as TaskCategory]?.color.split(' ')[0].replace('bg-', '').replace('-100', '') // Simplified color extraction
        })).map(item => ({
            ...item,
            color: getColorForCategory(item.name) // Helper function for colors
        }));
        setTaskDistribution(chartData);
      }

      // 2. Weekly Activity
      const start = startOfWeek(new Date());
      const end = endOfWeek(new Date());
      
      const { data: weeklyTasks } = await supabase
        .from('tasks')
        .select('created_at, status, due_date')
        .eq('space_id', currentSpace.id)
        .eq('assigned_to', user.id)
        .gte('due_date', subDays(new Date(), 7).toISOString());

      if (weeklyTasks) {
        const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
        const activityData = days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = weeklyTasks.filter(t => t.due_date?.startsWith(dateStr));
          return {
            name: format(day, 'EEE'),
            completed: dayTasks.filter(t => t.status === 'done').length,
            assigned: dayTasks.length
          };
        });
        setWeeklyActivity(activityData);
      }

      // 3. Points History (Mock data for now as we don't have a points history table yet)
      // In a real app, you'd query a points_history table
      const mockPointsHistory = Array.from({ length: 7 }).map((_, i) => ({
        date: format(subDays(new Date(), 6 - i), 'MMM dd'),
        points: Math.floor(Math.random() * 50) + (i * 10)
      }));
      setPointsHistory(mockPointsHistory);

    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

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
          </p>
        </div>
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
