"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, ChevronLeft, Search, Filter, MoreVertical,
  Crown, Shield, User, Mail, Bell, Trash2, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Copy, RefreshCw, UserPlus, Clock, Target, Flame, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import { Profile, SpaceMember } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, subDays, differenceInDays } from "date-fns";

interface MemberWithStats extends SpaceMember {
  profile: Profile;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue: number;
  lastActive: Date | null;
  trend: 'up' | 'down' | 'stable';
  streak: number;
  weeklyTasks: number;
}

export default function TeamMembersPage() {
  const { user, currentSpace, spaceMembership, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'warning' | 'inactive'>('all');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    if (currentSpace && user) {
      fetchMembers();
    } else if (!authLoading) {
      // Clear members when no space or user
      setMembers([]);
      setLoading(false);
    }
  }, [currentSpace?.id, user?.id, authLoading]); // Depend on user ID too

  const fetchMembers = useCallback(async () => {
    if (!currentSpace) return;
    setLoading(true);

    try {
      const { data: membersData } = await supabase
        .from('space_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('space_id', currentSpace.id);

      if (!membersData) return;

      // Fetch task stats for each member
      const enrichedMembers = await Promise.all(
        membersData.map(async (member) => {
          const [completedRes, pendingRes, overdueRes, weeklyRes] = await Promise.all([
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', currentSpace.id)
              .eq('assigned_to', member.user_id)
              .eq('status', 'done'),
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', currentSpace.id)
              .eq('assigned_to', member.user_id)
              .in('status', ['todo', 'in_progress']),
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', currentSpace.id)
              .eq('assigned_to', member.user_id)
              .in('status', ['todo', 'in_progress'])
              .lt('due_date', new Date().toISOString()),
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', currentSpace.id)
              .eq('assigned_to', member.user_id)
              .eq('status', 'done')
              .gte('updated_at', subDays(new Date(), 7).toISOString())
          ]);

          // Get last completed task date
          const { data: lastTask } = await supabase
            .from('tasks')
            .select('updated_at')
            .eq('space_id', currentSpace.id)
            .eq('assigned_to', member.user_id)
            .eq('status', 'done')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          // Calculate trend (last week vs previous week)
          const lastWeekCount = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', currentSpace.id)
            .eq('assigned_to', member.user_id)
            .eq('status', 'done')
            .gte('updated_at', subDays(new Date(), 7).toISOString());

          const prevWeekCount = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', currentSpace.id)
            .eq('assigned_to', member.user_id)
            .eq('status', 'done')
            .gte('updated_at', subDays(new Date(), 14).toISOString())
            .lt('updated_at', subDays(new Date(), 7).toISOString());

          const trend = (lastWeekCount.count || 0) > (prevWeekCount.count || 0) ? 'up' :
                       (lastWeekCount.count || 0) < (prevWeekCount.count || 0) ? 'down' : 'stable';

          // Calculate streak (consecutive days with tasks)
          let streak = 0;
          if (lastTask?.updated_at) {
            const lastDate = new Date(lastTask.updated_at);
            const daysAgo = differenceInDays(new Date(), lastDate);
            streak = Math.max(0, 7 - daysAgo);
          }

          return {
            ...member,
            tasksCompleted: completedRes.count || 0,
            tasksPending: pendingRes.count || 0,
            tasksOverdue: overdueRes.count || 0,
            weeklyTasks: weeklyRes.count || 0,
            lastActive: lastTask?.updated_at ? new Date(lastTask.updated_at) : null,
            trend,
            streak
          };
        })
      );

      // Sort by points
      enrichedMembers.sort((a, b) => b.points - a.points);
      setMembers(enrichedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [currentSpace]);

  // Subscribe to real-time updates for tasks and space members
  useRealtimeSubscription(
    'tasks',
    useCallback(() => {
      if (currentSpace) fetchMembers();
    }, [currentSpace, fetchMembers]),
    currentSpace ? `space_id=eq.${currentSpace.id}` : undefined
  );

  useRealtimeSubscription(
    'space_members',
    useCallback(() => {
      if (currentSpace) fetchMembers();
    }, [currentSpace, fetchMembers]),
    currentSpace ? `space_id=eq.${currentSpace.id}` : undefined
  );

  const getMemberStatus = (member: MemberWithStats) => {
    if (member.tasksOverdue > 2) return 'warning';
    if (!member.lastActive || subDays(new Date(), 14) > member.lastActive) return 'inactive';
    return 'active';
  };

  const handleCopyInviteCode = () => {
    if (currentSpace?.invite_code) {
      navigator.clipboard.writeText(currentSpace.invite_code);
      toast.success("Invite code copied!");
    }
  };

  const handleSendReminder = async (memberId: string, memberName: string) => {
    toast.success(`Reminder sent to ${memberName}`);
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    if (!currentSpace) return;

    try {
      const { error } = await supabase
        .from('space_members')
        .update({ role: 'admin' })
        .eq('space_id', currentSpace.id)
        .eq('user_id', memberId);

      if (error) throw error;
      toast.success("Member promoted to admin");
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && getMemberStatus(member) === filterStatus;
  });

  const isAdmin = spaceMembership?.role === 'admin';
  const totalOverdue = members.reduce((sum, m) => sum + m.tasksOverdue, 0);
  const avgWeeklyTasks = members.length ? Math.round(members.reduce((sum, m) => sum + m.weeklyTasks, 0) / members.length) : 0;

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="space-y-4 pb-24">
        <div className="h-12 bg-muted/20 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />)}
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
          <Users className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Team Members</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Sign in to view your team members and their contribution stats.
        </p>
        <div className="flex gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/login?mode=signup">Create Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">Please select a space first</p>
        <Button asChild className="mt-4 rounded-xl">
          <Link href="/spaces">Go to Spaces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Compact Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl shrink-0">
          <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">Team</h1>
          <p className="text-[10px] text-muted-foreground truncate">{currentSpace.name}</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" className="h-8 rounded-xl gap-1 text-xs shrink-0" onClick={handleCopyInviteCode}>
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Invite</span>
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-xl shrink-0" onClick={fetchMembers}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Quick Stats - Compact 4 Column */}
      <div className="grid grid-cols-4 gap-1.5">
        <Card className="rounded-xl bg-linear-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-2.5 text-center">
            <p className="text-base font-bold text-green-600">{members.filter(m => getMemberStatus(m) === 'active').length}</p>
            <p className="text-[8px] text-muted-foreground font-medium">Active</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-linear-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-2.5 text-center">
            <p className="text-base font-bold text-yellow-600">{members.filter(m => getMemberStatus(m) === 'warning').length}</p>
            <p className="text-[8px] text-muted-foreground font-medium">Warning</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-linear-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-2.5 text-center">
            <p className="text-base font-bold text-red-500">{totalOverdue}</p>
            <p className="text-[8px] text-muted-foreground font-medium">Overdue</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-2.5 text-center">
            <p className="text-base font-bold text-primary">{avgWeeklyTasks}</p>
            <p className="text-[8px] text-muted-foreground font-medium">Avg/Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter - Compact */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-900 border border-border/50 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <select
          title="Filter members by status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-2 py-2 bg-white dark:bg-slate-900 border border-border/50 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none min-w-18"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="warning">Warning</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Members List - Optimized for Mobile */}
      <div className="space-y-1.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))
        ) : filteredMembers.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium text-sm">No members found</p>
              <p className="text-xs text-muted-foreground">Try adjusting filters</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredMembers.map((member, index) => {
              const status = getMemberStatus(member);
              const isExpanded = selectedMember === member.user_id;
              const isMe = member.user_id === user?.id;

              return (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className={cn(
                    "rounded-xl border-border/50 overflow-hidden transition-all",
                    isMe && "ring-1 ring-primary/30 bg-primary/5",
                    status === 'warning' && !isMe && "border-yellow-500/30 bg-yellow-500/5",
                    status === 'inactive' && !isMe && "border-gray-500/30 bg-gray-500/5"
                  )}>
                    <button
                      onClick={() => setSelectedMember(isExpanded ? null : member.user_id)}
                      className="w-full text-left"
                    >
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar & Rank */}
                          <div className="relative shrink-0">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold",
                              index === 0 ? "bg-linear-to-br from-yellow-400 to-amber-500 text-white shadow-sm" :
                              index === 1 ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" :
                              index === 2 ? "bg-orange-200 dark:bg-orange-900/50 text-orange-600" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {(member.profile?.username?.[0] || member.profile?.full_name?.[0] || '?').toUpperCase()}
                            </div>
                            {member.role === 'admin' && (
                              <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center shadow-sm">
                                <Crown className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -left-0.5 h-4 w-4 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold border border-border/50">
                              {index + 1}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm truncate">
                                {member.profile?.username || member.profile?.full_name || 'User'}
                              </span>
                              {isMe && (
                                <span className="px-1 py-0.5 bg-primary text-white text-[7px] font-bold rounded shrink-0">
                                  YOU
                                </span>
                              )}
                              {member.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />}
                              {member.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn(
                                "text-[8px] font-bold px-1 py-0.5 rounded uppercase",
                                status === 'active' && "bg-green-500/10 text-green-600",
                                status === 'warning' && "bg-yellow-500/10 text-yellow-600",
                                status === 'inactive' && "bg-gray-500/10 text-gray-500"
                              )}>
                                {status}
                              </span>
                              {member.tasksOverdue > 0 && (
                                <span className="text-[8px] font-bold text-red-500 flex items-center gap-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {member.tasksOverdue}
                                </span>
                              )}
                              {member.streak > 0 && (
                                <span className="text-[8px] font-bold text-orange-500 flex items-center gap-0.5">
                                  <Flame className="h-2.5 w-2.5" />
                                  {member.streak}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Points & Arrow */}
                          <div className="text-right shrink-0 flex items-center gap-1">
                            <div>
                              <p className="text-sm font-bold">{member.points}</p>
                              <p className="text-[8px] text-muted-foreground">pts</p>
                            </div>
                            <ChevronRight className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )} />
                          </div>
                        </div>
                      </CardContent>
                    </button>

                    {/* Expanded Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-2.5 pb-2.5 border-t border-border/30">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-1.5 mt-2">
                              <div className="p-1.5 bg-green-500/10 rounded-lg text-center">
                                <p className="text-xs font-bold text-green-600">{member.tasksCompleted}</p>
                                <p className="text-[7px] text-muted-foreground">Done</p>
                              </div>
                              <div className="p-1.5 bg-blue-500/10 rounded-lg text-center">
                                <p className="text-xs font-bold text-blue-600">{member.tasksPending}</p>
                                <p className="text-[7px] text-muted-foreground">Pending</p>
                              </div>
                              <div className="p-1.5 bg-red-500/10 rounded-lg text-center">
                                <p className="text-xs font-bold text-red-600">{member.tasksOverdue}</p>
                                <p className="text-[7px] text-muted-foreground">Overdue</p>
                              </div>
                              <div className="p-1.5 bg-primary/10 rounded-lg text-center">
                                <p className="text-xs font-bold text-primary">{member.weeklyTasks}</p>
                                <p className="text-[7px] text-muted-foreground">This Week</p>
                              </div>
                            </div>

                            {/* Last Active */}
                            {member.lastActive && (
                              <p className="text-[9px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Last active: {formatDistanceToNow(member.lastActive, { addSuffix: true })}
                              </p>
                            )}

                            {/* Admin Actions */}
                            {isAdmin && !isMe && (
                              <div className="flex gap-1.5 mt-2">
                                {(status === 'warning' || status === 'inactive') && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 h-7 text-[10px] rounded-lg border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendReminder(member.user_id, member.profile?.username || 'User');
                                    }}
                                  >
                                    <Bell className="h-3 w-3 mr-1" />
                                    Remind
                                  </Button>
                                )}
                                {member.role !== 'admin' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 h-7 text-[10px] rounded-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePromoteToAdmin(member.user_id);
                                    }}
                                  >
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Invite Code - Compact */}
      {isAdmin && currentSpace.invite_code && (
        <Card className="rounded-xl border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Share Code</p>
                <p className="text-base font-mono font-bold tracking-wider">{currentSpace.invite_code}</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1.5 text-xs" onClick={handleCopyInviteCode}>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
