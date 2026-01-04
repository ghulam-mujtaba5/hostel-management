"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle, Clock, Trophy, Flame, Bell, 
  ChevronRight, User, Calendar, Target, Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Profile, Task, SpaceMember } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MemberStats {
  user_id: string;
  profile: Profile;
  role: 'admin' | 'member';
  points: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue: number;
  lastTaskDate: Date | null;
  streak: number;
  avgCompletionTime: number; // hours
  participationRate: number; // percentage
  trend: 'up' | 'down' | 'stable';
  status: 'active' | 'warning' | 'inactive' | 'excellent';
}

interface MemberAccountabilityProps {
  compact?: boolean;
  showAll?: boolean;
}

export function MemberAccountability({ compact = false, showAll = false }: MemberAccountabilityProps) {
  const { user, currentSpace } = useAuth();
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    if (currentSpace) {
      fetchMemberStats();
    }
  }, [currentSpace]);

  const fetchMemberStats = async () => {
    if (!currentSpace) return;
    setLoading(true);

    try {
      // Fetch all members
      const { data: membersData } = await supabase
        .from('space_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('space_id', currentSpace.id);

      if (!membersData) return;

      // Fetch all tasks for the space in last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('space_id', currentSpace.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculate stats for each member
      const stats: MemberStats[] = membersData.map((member) => {
        const memberTasks = tasks?.filter(t => t.assigned_to === member.user_id) || [];
        const completedTasks = memberTasks.filter(t => t.status === 'done');
        const pendingTasks = memberTasks.filter(t => t.status !== 'done');
        const overdueTasks = pendingTasks.filter(t => 
          t.due_date && new Date(t.due_date) < new Date()
        );

        // Calculate streak (consecutive days with task completion)
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const day = subDays(today, i);
          const hasTask = completedTasks.some(t => {
            const taskDate = new Date(t.updated_at || t.created_at);
            return isWithinInterval(taskDate, {
              start: startOfDay(day),
              end: endOfDay(day)
            });
          });
          if (hasTask) streak++;
          else if (i > 0) break; // Break if gap found after first day
        }

        // Calculate last task date
        const lastCompleted = completedTasks.sort((a, b) => 
          new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
        )[0];
        const lastTaskDate = lastCompleted ? new Date(lastCompleted.updated_at || lastCompleted.created_at) : null;

        // Calculate participation rate (tasks completed / total tasks in space)
        const totalSpaceTasks = tasks?.filter(t => t.status === 'done').length || 1;
        const participationRate = Math.round((completedTasks.length / totalSpaceTasks) * 100);

        // Determine trend based on recent activity
        const lastWeekTasks = completedTasks.filter(t => 
          new Date(t.updated_at || t.created_at) > subDays(new Date(), 7)
        ).length;
        const prevWeekTasks = completedTasks.filter(t => {
          const date = new Date(t.updated_at || t.created_at);
          return date > subDays(new Date(), 14) && date <= subDays(new Date(), 7);
        }).length;
        
        const trend = lastWeekTasks > prevWeekTasks ? 'up' : 
                      lastWeekTasks < prevWeekTasks ? 'down' : 'stable';

        // Determine status
        let status: MemberStats['status'] = 'active';
        if (overdueTasks.length > 2 || (lastTaskDate && subDays(new Date(), 7) > lastTaskDate)) {
          status = 'warning';
        } else if (!lastTaskDate || subDays(new Date(), 14) > lastTaskDate) {
          status = 'inactive';
        } else if (streak >= 5 && participationRate > 20) {
          status = 'excellent';
        }

        return {
          user_id: member.user_id,
          profile: member.profile,
          role: member.role,
          points: member.points,
          tasksCompleted: completedTasks.length,
          tasksPending: pendingTasks.length,
          tasksOverdue: overdueTasks.length,
          lastTaskDate,
          streak,
          avgCompletionTime: 24, // Mock - would need more data
          participationRate,
          trend,
          status
        };
      });

      // Sort by points descending
      stats.sort((a, b) => b.points - a.points);
      setMembers(stats);
    } catch (error) {
      console.error("Error fetching member stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: MemberStats['status']) => {
    switch (status) {
      case 'excellent':
        return { 
          color: 'badge-active', 
          icon: Trophy,
          label: 'Top Contributor',
          bgColor: 'bg-green-500/5'
        };
      case 'active':
        return { 
          color: 'badge-active', 
          icon: CheckCircle,
          label: 'Active',
          bgColor: 'bg-green-500/5'
        };
      case 'warning':
        return { 
          color: 'badge-warning', 
          icon: AlertTriangle,
          label: 'Needs Attention',
          bgColor: 'bg-yellow-500/5'
        };
      case 'inactive':
        return { 
          color: 'badge-inactive', 
          icon: Clock,
          label: 'Inactive',
          bgColor: 'bg-gray-500/5'
        };
    }
  };

  const getTrendIcon = (trend: MemberStats['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayMembers = showAll ? members : members.slice(0, 5);
  const warningCount = members.filter(m => m.status === 'warning').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Team Accountability</CardTitle>
              <p className="text-[10px] text-muted-foreground">
                {members.length} members • {warningCount > 0 && <span className="text-yellow-600">{warningCount} need attention</span>}
              </p>
            </div>
          </div>
          {!showAll && members.length > 5 && (
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link href="/admin/members">View All</Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {/* Quick Stats Summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-green-500/5 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-green-600">{members.filter(m => m.status === 'excellent' || m.status === 'active').length}</p>
            <p className="text-[9px] text-muted-foreground font-medium">Active</p>
          </div>
          <div className="bg-yellow-500/5 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-yellow-600">{warningCount}</p>
            <p className="text-[9px] text-muted-foreground font-medium">Warning</p>
          </div>
          <div className="bg-gray-500/5 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-gray-500">{inactiveCount}</p>
            <p className="text-[9px] text-muted-foreground font-medium">Inactive</p>
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-2">
          <AnimatePresence>
            {displayMembers.map((member, index) => {
              const statusConfig = getStatusConfig(member.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = selectedMember === member.user_id;
              const isMe = member.user_id === user?.id;

              return (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className={cn(
                      "rounded-xl border border-border/50 overflow-hidden transition-all",
                      isMe && "ring-1 ring-primary/20",
                      statusConfig.bgColor
                    )}
                  >
                    <button
                      onClick={() => setSelectedMember(isExpanded ? null : member.user_id)}
                      className="w-full p-3 flex items-center gap-3 text-left"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold",
                          index === 0 ? "bg-linear-to-br from-yellow-400 to-amber-500 text-white" :
                          index === 1 ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" :
                          index === 2 ? "bg-orange-200 dark:bg-orange-900/50 text-orange-600" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                        </div>
                        {member.streak >= 3 && (
                          <div className="absolute -top-1 -right-1 animate-flame">
                            🔥
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">
                            {member.profile?.username || member.profile?.full_name || 'User'}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 bg-primary text-white text-[8px] font-bold rounded-full">
                              YOU
                            </span>
                          )}
                          {getTrendIcon(member.trend)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("accountability-badge", statusConfig.color)}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusConfig.label}
                          </span>
                          {member.tasksOverdue > 0 && (
                            <span className="accountability-badge badge-danger">
                              {member.tasksOverdue} overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points & Arrow */}
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-sm font-bold">{member.points}</p>
                          <p className="text-[9px] text-muted-foreground">pts</p>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1 border-t border-border/50">
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <p className="text-base font-bold text-green-600">{member.tasksCompleted}</p>
                                <p className="text-[9px] text-muted-foreground">Done</p>
                              </div>
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <p className="text-base font-bold text-blue-600">{member.tasksPending}</p>
                                <p className="text-[9px] text-muted-foreground">Pending</p>
                              </div>
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <p className="text-base font-bold">{member.streak}</p>
                                <p className="text-[9px] text-muted-foreground">Streak</p>
                              </div>
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <p className="text-base font-bold">{member.participationRate}%</p>
                                <p className="text-[9px] text-muted-foreground">Share</p>
                              </div>
                            </div>
                            {member.lastTaskDate && (
                              <p className="text-[10px] text-muted-foreground text-center mt-2">
                                Last active: {formatDistanceToNow(member.lastTaskDate, { addSuffix: true })}
                              </p>
                            )}
                            {member.status === 'warning' && member.role !== 'admin' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="w-full mt-2 h-8 text-xs border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                              >
                                <Bell className="h-3 w-3 mr-1.5" />
                                Send Reminder
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
