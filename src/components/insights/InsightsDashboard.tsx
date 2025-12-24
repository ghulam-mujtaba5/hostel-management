"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TaskDistributionChart } from "./TaskDistributionChart";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { PointsHistoryChart } from "./PointsHistoryChart";
import { TASK_CATEGORIES, TaskCategory } from "@/types";
import { startOfWeek, endOfWeek, format, subDays, eachDayOfInterval } from "date-fns";
import { Loader2 } from "lucide-react";

export function InsightsDashboard() {
  const { user, currentSpace } = useAuth();
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Tasks assigned vs completed over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyActivityChart data={weeklyActivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskDistributionChart data={taskDistribution} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Points Progression</CardTitle>
          <CardDescription>Your points growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <PointsHistoryChart data={pointsHistory} />
        </CardContent>
      </Card>
    </div>
  );
}
