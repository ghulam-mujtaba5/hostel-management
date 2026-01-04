"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, CheckCircle2, AlertTriangle, 
  Award, BarChart3, Target, Flame, Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TaskCategory, TASK_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

interface TaskStats {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalCompleted: number;
  easyTasks: number;
  mediumTasks: number;
  hardTasks: number;
  totalPoints: number;
  categoryBreakdown: Record<TaskCategory, number>;
  recentActivity: number; // tasks in last 7 days
  fairnessScore: number;
}

interface TaskTypeCount {
  taskTitle: string;
  totalDone: number;
  byUser: { userId: string; username: string; count: number }[];
}

const FAIRNESS_THRESHOLDS = {
  excellent: 90,
  good: 70,
  fair: 50,
  needsAttention: 0
};

export function TaskStatsChart() {
  const { user, currentSpace } = useAuth();
  const [memberStats, setMemberStats] = useState<TaskStats[]>([]);
  const [taskTypeStats, setTaskTypeStats] = useState<TaskTypeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'members' | 'tasks'>('overview');

  const fetchTaskStats = useCallback(async () => {
    if (!currentSpace) return;
    setLoading(true);

    try {
      // Fetch all members with their profiles
      const { data: members } = await supabase
        .from('space_members')
        .select('*, profile:profiles(*)')
        .eq('space_id', currentSpace.id);

      // Fetch all completed tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('space_id', currentSpace.id)
        .eq('status', 'done');

      if (members && tasks) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Calculate per-member stats
        const stats: TaskStats[] = members.map(member => {
          const memberTasks = tasks.filter(t => t.assigned_to === member.user_id);
          const recentTasks = memberTasks.filter(t => 
            new Date(t.completed_at || t.created_at) >= sevenDaysAgo
          );

          const categoryBreakdown = {} as Record<TaskCategory, number>;
          Object.keys(TASK_CATEGORIES).forEach(cat => {
            categoryBreakdown[cat as TaskCategory] = memberTasks.filter(t => t.category === cat).length;
          });

          const easyTasks = memberTasks.filter(t => t.difficulty <= 3).length;
          const mediumTasks = memberTasks.filter(t => t.difficulty >= 4 && t.difficulty <= 6).length;
          const hardTasks = memberTasks.filter(t => t.difficulty >= 7).length;

          // Calculate fairness score based on difficulty distribution and workload balance
          const totalMembers = members.length;
          const avgTasksPerMember = tasks.length / totalMembers;
          const taskBalance = Math.abs(memberTasks.length - avgTasksPerMember) / Math.max(avgTasksPerMember, 1);
          const difficultyBalance = hardTasks > 0 ? (hardTasks / (memberTasks.length || 1)) * 100 : 0;
          const fairnessScore = Math.max(0, Math.min(100, 100 - (taskBalance * 30) + (difficultyBalance * 0.3)));

          return {
            userId: member.user_id,
            username: member.profile?.username || member.profile?.full_name || 'Unknown',
            avatarUrl: member.profile?.avatar_url,
            totalCompleted: memberTasks.length,
            easyTasks,
            mediumTasks,
            hardTasks,
            totalPoints: member.points || 0,
            categoryBreakdown,
            recentActivity: recentTasks.length,
            fairnessScore: Math.round(fairnessScore)
          };
        });

        setMemberStats(stats.sort((a, b) => b.totalPoints - a.totalPoints));

        // Calculate task type stats
        const taskGroups: Record<string, TaskTypeCount> = {};
        tasks.forEach(task => {
          const key = task.title.toLowerCase();
          if (!taskGroups[key]) {
            taskGroups[key] = {
              taskTitle: task.title,
              totalDone: 0,
              byUser: []
            };
          }
          taskGroups[key].totalDone++;
          
          const member = members.find(m => m.user_id === task.assigned_to);
          const userEntry = taskGroups[key].byUser.find(u => u.userId === task.assigned_to);
          if (userEntry) {
            userEntry.count++;
          } else {
            taskGroups[key].byUser.push({
              userId: task.assigned_to || '',
              username: member?.profile?.username || 'Unknown',
              count: 1
            });
          }
        });

        setTaskTypeStats(
          Object.values(taskGroups)
            .sort((a, b) => b.totalDone - a.totalDone)
            .slice(0, 10)
        );
      }
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentSpace]);

  useEffect(() => {
    if (currentSpace) {
      fetchTaskStats();
    }
  }, [currentSpace, fetchTaskStats]);

  const getFairnessColor = (score: number) => {
    if (score >= FAIRNESS_THRESHOLDS.excellent) return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    if (score >= FAIRNESS_THRESHOLDS.good) return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    if (score >= FAIRNESS_THRESHOLDS.fair) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-500 bg-red-100 dark:bg-red-900/30';
  };

  const getFairnessLabel = (score: number) => {
    if (score >= FAIRNESS_THRESHOLDS.excellent) return 'Excellent';
    if (score >= FAIRNESS_THRESHOLDS.good) return 'Good';
    if (score >= FAIRNESS_THRESHOLDS.fair) return 'Fair';
    return 'Needs Balance';
  };

  // Calculate overall fairness
  const overallFairness = memberStats.length > 0
    ? Math.round(memberStats.reduce((sum, m) => sum + m.fairnessScore, 0) / memberStats.length)
    : 0;

  const totalTasks = memberStats.reduce((sum, m) => sum + m.totalCompleted, 0);
  const avgTasksPerMember = memberStats.length > 0 ? Math.round(totalTasks / memberStats.length) : 0;

  // Workload balance data for chart
  const workloadData = memberStats.map(m => ({
    name: m.username.slice(0, 10),
    tasks: m.totalCompleted,
    points: m.totalPoints,
    easy: m.easyTasks,
    medium: m.mediumTasks,
    hard: m.hardTasks,
    fairness: m.fairnessScore
  }));

  // Difficulty distribution for pie chart
  const difficultyData = [
    { name: 'Easy', value: memberStats.reduce((s, m) => s + m.easyTasks, 0), color: '#10b981' },
    { name: 'Medium', value: memberStats.reduce((s, m) => s + m.mediumTasks, 0), color: '#f59e0b' },
    { name: 'Hard', value: memberStats.reduce((s, m) => s + m.hardTasks, 0), color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
          <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                  <p className="text-xs text-muted-foreground">Total Completed</p>
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
          <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgTasksPerMember}</p>
                  <p className="text-xs text-muted-foreground">Avg per Member</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={cn(
            "border-border/50",
            overallFairness >= 70 
              ? "bg-gradient-to-br from-green-500/10 to-green-600/5" 
              : "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  overallFairness >= 70 ? "bg-green-500/20" : "bg-yellow-500/20"
                )}>
                  <Shield className={cn(
                    "h-5 w-5",
                    overallFairness >= 70 ? "text-green-500" : "text-yellow-500"
                  )} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallFairness}%</p>
                  <p className="text-xs text-muted-foreground">Fairness Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {memberStats.reduce((s, m) => s + m.recentActivity, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'members', label: 'Members', icon: Users },
          { key: 'tasks', label: 'Task Types', icon: Target }
        ].map(view => (
          <button
            key={view.key}
            onClick={() => setActiveView(view.key as 'overview' | 'members' | 'tasks')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeView === view.key
                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <view.icon className="h-4 w-4" />
            {view.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Workload Distribution */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Workload Distribution
                </CardTitle>
                <CardDescription>Tasks completed by each member</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="easy" stackId="a" fill="#10b981" name="Easy" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium" />
                    <Bar dataKey="hard" stackId="a" fill="#ef4444" name="Hard" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Difficulty Distribution */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Difficulty Balance
                </CardTitle>
                <CardDescription>Task difficulty distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeView === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4"
          >
            {memberStats.map((member, index) => (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "border-border/50 overflow-hidden",
                  member.userId === user?.id && "ring-2 ring-primary/30"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar & Rank */}
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          {member.avatarUrl ? (
                            <AvatarImage src={member.avatarUrl} />
                          ) : (
                            <AvatarFallback>{member.username[0]?.toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        {index < 3 && (
                          <div className={cn(
                            "absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                            index === 0 && "bg-yellow-400 text-yellow-900",
                            index === 1 && "bg-gray-300 text-gray-700",
                            index === 2 && "bg-amber-600 text-amber-100"
                          )}>
                            {index + 1}
                          </div>
                        )}
                      </div>

                      {/* Name & Stats */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{member.username}</h3>
                          {member.userId === user?.id && (
                            <Badge variant="outline" className="text-[10px]">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {member.totalCompleted} tasks
                          </span>
                          <span className="text-xs font-medium text-primary">
                            {member.totalPoints} pts
                          </span>
                        </div>
                      </div>

                      {/* Difficulty Breakdown */}
                      <div className="hidden md:flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-500">{member.easyTasks}</p>
                          <p className="text-[10px] text-muted-foreground">Easy</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-yellow-500">{member.mediumTasks}</p>
                          <p className="text-[10px] text-muted-foreground">Medium</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-500">{member.hardTasks}</p>
                          <p className="text-[10px] text-muted-foreground">Hard</p>
                        </div>
                      </div>

                      {/* Fairness Score */}
                      <div className={cn(
                        "px-3 py-2 rounded-xl text-center",
                        getFairnessColor(member.fairnessScore)
                      )}>
                        <p className="text-lg font-bold">{member.fairnessScore}%</p>
                        <p className="text-[10px] font-medium">{getFairnessLabel(member.fairnessScore)}</p>
                      </div>
                    </div>

                    {/* Category Progress Bars */}
                    <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2">
                      {Object.entries(TASK_CATEGORIES).map(([key, { emoji, label }]) => {
                        const count = member.categoryBreakdown[key as TaskCategory] || 0;
                        const maxCount = Math.max(...memberStats.map(m => m.categoryBreakdown[key as TaskCategory] || 0), 1);
                        const percentage = (count / maxCount) * 100;
                        
                        return (
                          <div key={key} className="text-center" title={`${label}: ${count}`}>
                            <span className="text-lg">{emoji}</span>
                            <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                                className="h-full bg-primary"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeView === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Task Type Statistics
                </CardTitle>
                <CardDescription>Who does what the most</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {taskTypeStats.map((taskType, index) => (
                  <motion.div
                    key={taskType.taskTitle}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium truncate flex-1">{taskType.taskTitle}</h4>
                      <Badge variant="secondary" className="ml-2">
                        {taskType.totalDone} times
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {taskType.byUser
                        .sort((a, b) => b.count - a.count)
                        .map((userStat, i) => {
                          const isTopContributor = i === 0;
                          const percentage = Math.round((userStat.count / taskType.totalDone) * 100);
                          
                          return (
                            <div
                              key={userStat.userId}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                                isTopContributor 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "bg-muted"
                              )}
                            >
                              {isTopContributor && <Award className="h-3.5 w-3.5" />}
                              <span>{userStat.username}</span>
                              <span className="text-xs opacity-70">
                                {userStat.count}x ({percentage}%)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </motion.div>
                ))}

                {taskTypeStats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No task data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fairness Warning */}
      {overallFairness < 60 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">
                    Workload Imbalance Detected
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Some members are doing more work than others. The fairness system will 
                    encourage balanced task distribution by limiting consecutive easy tasks 
                    and suggesting medium/hard tasks to frequent contributors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
