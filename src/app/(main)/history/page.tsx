'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  History, CheckCircle2, Clock, User, 
  Filter, Calendar, ArrowUpRight, Activity,
  TrendingUp, Award, Target, Sparkles,
  ChevronRight, Image as ImageIcon, BarChart3,
  Scale, AlertTriangle, Flame, Trophy
} from 'lucide-react';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { Task, ActivityLog, ServiceQueue, SpaceMember, Profile, TASK_CATEGORIES, TaskCategory } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TaskTypeStats {
  taskTitle: string;
  totalCompleted: number;
  byMember: { userId: string; username: string; avatarUrl: string | null; count: number }[];
}

export default function HistoryPage() {
  const { user, currentSpace } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'services' | 'stats'>('all');
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<(ActivityLog & { profile: Profile })[]>([]);
  const [completedTasks, setCompletedTasks] = useState<(Task & { assignee: Profile })[]>([]);
  const [serviceHistory, setServiceHistory] = useState<(ServiceQueue & { profile: Profile })[]>([]);
  const [members, setMembers] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [taskTypeStats, setTaskTypeStats] = useState<TaskTypeStats[]>([]);

  useEffect(() => {
    if (currentSpace) {
      fetchHistoryData();
    }
  }, [currentSpace]);

  async function fetchHistoryData() {
    if (!currentSpace) return;
    setLoading(true);

    try {
      // 1. Fetch Activity Logs
      const { data: logsData } = await supabase
        .from('activity_log')
        .select('*, profile:profiles(*)')
        .eq('space_id', currentSpace.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (logsData) setLogs(logsData as any);

      // 2. Fetch Completed Tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, assignee:profiles(*)')
        .eq('space_id', currentSpace.id)
        .eq('status', 'done')
        .order('completed_at', { ascending: false })
        .limit(100);

      if (tasksData) {
        setCompletedTasks(tasksData as any);
        
        // Calculate task type statistics
        const taskGroups: Record<string, TaskTypeStats> = {};
        tasksData.forEach((task: any) => {
          const key = task.title.toLowerCase().trim();
          if (!taskGroups[key]) {
            taskGroups[key] = {
              taskTitle: task.title,
              totalCompleted: 0,
              byMember: []
            };
          }
          taskGroups[key].totalCompleted++;
          
          const memberEntry = taskGroups[key].byMember.find(m => m.userId === task.assigned_to);
          if (memberEntry) {
            memberEntry.count++;
          } else {
            taskGroups[key].byMember.push({
              userId: task.assigned_to || '',
              username: task.assignee?.username || task.assignee?.full_name || 'Unknown',
              avatarUrl: task.assignee?.avatar_url,
              count: 1
            });
          }
        });

        // Sort by most completed and limit
        setTaskTypeStats(
          Object.values(taskGroups)
            .sort((a, b) => b.totalCompleted - a.totalCompleted)
            .slice(0, 15)
        );
      }

      // 3. Fetch Service History
      const { data: servicesData } = await supabase
        .from('service_queue')
        .select('*, profile:profiles(*)')
        .eq('space_id', currentSpace.id)
        .in('status', ['completed', 'cancelled'])
        .order('updated_at', { ascending: false })
        .limit(50);

      if (servicesData) setServiceHistory(servicesData as any);

      // 4. Fetch Members for Performance
      const { data: membersData } = await supabase
        .from('space_members')
        .select('*, profile:profiles(*)')
        .eq('space_id', currentSpace.id);

      if (membersData) setMembers(membersData as any);

    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
        activeTab === id 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  );

  // Calculate some quick stats
  const totalTasksDone = completedTasks.length;
  const thisWeekTasks = completedTasks.filter(t => {
    const date = new Date(t.completed_at || t.updated_at || t.created_at);
    return date >= subDays(new Date(), 7);
  }).length;

  const myTasks = completedTasks.filter(t => t.assigned_to === user?.id).length;
  const avgTasksPerMember = members.length > 0 
    ? Math.round(totalTasksDone / members.length) 
    : 0;

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <div className="h-8 w-48 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider"
          >
            <History className="h-3 w-3" />
            Task History
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            History & <span className="text-primary">Statistics</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Track who does what, how often, and maintain fairness in {currentSpace?.name}
          </p>
        </div>
        
        <Button asChild variant="outline" className="rounded-xl gap-2">
          <Link href="/insights">
            <BarChart3 className="h-4 w-4" />
            View Full Insights
          </Link>
        </Button>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="border-border/50 bg-linear-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasksDone}</p>
                <p className="text-xs text-muted-foreground">Total Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-linear-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{thisWeekTasks}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-linear-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myTasks}</p>
                <p className="text-xs text-muted-foreground">My Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-linear-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Scale className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgTasksPerMember}</p>
                <p className="text-xs text-muted-foreground">Avg/Member</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 p-1.5 bg-muted/30 rounded-2xl border border-border/50 w-fit"
      >
        <TabButton id="all" label="All Activity" icon={Activity} />
        <TabButton id="tasks" label="Completed Tasks" icon={CheckCircle2} />
        <TabButton id="stats" label="Task Statistics" icon={Target} />
        <TabButton id="services" label="Services" icon={Clock} />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ALL ACTIVITY TAB */}
        {activeTab === 'all' && (
          <motion.div 
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Recent Activity Log
                </CardTitle>
                <CardDescription>Track all actions in your hostel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-muted ml-3 space-y-6 py-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No activity recorded yet.</p>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <motion.div 
                        key={log.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative pl-8"
                      >
                        <span className="absolute -left-2.25 top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background flex items-center justify-center">
                          <span className="h-2 w-2 rounded-full bg-white" />
                        </span>
                        <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                <span className="font-bold text-primary">{log.profile?.username || 'Unknown'}</span>
                                {' '}
                                <span className="text-muted-foreground">{log.action.replace(/_/g, ' ')}</span>
                              </p>
                              {log.details && typeof log.details === 'object' && (log.details as any).title && (
                                <p className="text-sm text-foreground">
                                  &quot;{(log.details as any).title}&quot;
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-lg">
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <motion.div 
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid gap-4">
              {completedTasks.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No completed tasks found.</p>
                  </CardContent>
                </Card>
              ) : (
                completedTasks.map((task, index) => {
                  const category = TASK_CATEGORIES[task.category as TaskCategory] || TASK_CATEGORIES.other;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all">
                        <div className="flex items-center p-4 gap-4">
                          <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-2xl">
                            {category.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{task.title}</h3>
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                +{task.difficulty} pts
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  {task.assignee?.avatar_url ? (
                                    <AvatarImage src={task.assignee.avatar_url} />
                                  ) : (
                                    <AvatarFallback className="text-[8px]">
                                      {task.assignee?.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="font-medium text-foreground">{task.assignee?.username}</span>
                              </div>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(task.completed_at || task.updated_at || task.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                          {task.proof_image_url && (
                            <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0 border-2 border-green-200 dark:border-green-800">
                              <img src={task.proof_image_url} alt="Proof" className="h-full w-full object-cover" />
                            </div>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* STATS TAB - NEW */}
        {activeTab === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Task Type Statistics
                </CardTitle>
                <CardDescription>
                  How many times each task was done, and by whom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {taskTypeStats.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No task statistics available yet.</p>
                  </div>
                ) : (
                  taskTypeStats.map((stat, index) => {
                    const maxContributor = stat.byMember.sort((a, b) => b.count - a.count)[0];
                    
                    return (
                      <motion.div
                        key={stat.taskTitle}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Target className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{stat.taskTitle}</h4>
                              <p className="text-xs text-muted-foreground">
                                Completed {stat.totalCompleted} time{stat.totalCompleted !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-lg font-bold">
                            {stat.totalCompleted}x
                          </Badge>
                        </div>

                        {/* Contributors */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Contributors
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {stat.byMember
                              .sort((a, b) => b.count - a.count)
                              .map((contributor, i) => {
                                const isTopContributor = i === 0;
                                const percentage = Math.round((contributor.count / stat.totalCompleted) * 100);
                                const isMe = contributor.userId === user?.id;
                                
                                return (
                                  <div
                                    key={contributor.userId}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                                      isTopContributor 
                                        ? "bg-primary/10 text-primary border border-primary/20" 
                                        : "bg-muted border border-transparent",
                                      isMe && "ring-2 ring-primary/30"
                                    )}
                                  >
                                    <Avatar className="h-5 w-5">
                                      {contributor.avatarUrl ? (
                                        <AvatarImage src={contributor.avatarUrl} />
                                      ) : (
                                        <AvatarFallback className="text-[8px]">
                                          {contributor.username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    {isTopContributor && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
                                    <span className="font-medium">{contributor.username}</span>
                                    {isMe && <Badge variant="outline" className="text-[8px] px-1 py-0">You</Badge>}
                                    <span className={cn(
                                      "text-xs px-2 py-0.5 rounded-full",
                                      isTopContributor ? "bg-primary/20" : "bg-muted-foreground/10"
                                    )}>
                                      {contributor.count}x ({percentage}%)
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Progress bar showing distribution */}
                        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden flex">
                          {stat.byMember
                            .sort((a, b) => b.count - a.count)
                            .map((contributor, i) => {
                              const percentage = (contributor.count / stat.totalCompleted) * 100;
                              const colors = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-purple-500'];
                              return (
                                <motion.div
                                  key={contributor.userId}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ delay: 0.2 + index * 0.03, duration: 0.5 }}
                                  className={cn("h-full", colors[i % colors.length])}
                                  title={`${contributor.username}: ${contributor.count} (${Math.round(percentage)}%)`}
                                />
                              );
                            })}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Fairness Notice */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Fairness System Active</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      To ensure fair workload distribution, members who frequently do easy tasks will be 
                      encouraged to take medium or hard tasks. Each member can complete up to 10 tasks 
                      per week before the fairness system suggests others take over.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <motion.div 
            key="services"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid gap-4">
              {serviceHistory.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No service history found.</p>
                  </CardContent>
                </Card>
              ) : (
                serviceHistory.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="border-border/50">
                      <div className="flex items-center p-4 gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                          service.status === 'completed' 
                            ? "bg-blue-100 dark:bg-blue-900/30" 
                            : "bg-red-100 dark:bg-red-900/30"
                        )}>
                          {service.status === 'completed' 
                            ? <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" /> 
                            : <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                          }
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold capitalize">{service.service_type.replace(/_/g, ' ')}</h3>
                          <p className="text-sm text-muted-foreground">
                            Requested by {service.profile?.username} • {formatDistanceToNow(new Date(service.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant={service.status === 'completed' ? 'default' : 'outline'}>
                          {service.status}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
