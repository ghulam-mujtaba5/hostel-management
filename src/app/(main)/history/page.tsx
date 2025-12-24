'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  History, CheckCircle2, Clock, User, 
  Filter, Calendar, ArrowUpRight, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Task, ActivityLog, ServiceQueue, SpaceMember, Profile } from '@/types';

export default function HistoryPage() {
  const { currentSpace } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'services' | 'performance'>('all');
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<(ActivityLog & { profile: Profile })[]>([]);
  const [completedTasks, setCompletedTasks] = useState<(Task & { assignee: Profile })[]>([]);
  const [serviceHistory, setServiceHistory] = useState<(ServiceQueue & { profile: Profile })[]>([]);
  const [members, setMembers] = useState<(SpaceMember & { profile: Profile })[]>([]);

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
        .order('updated_at', { ascending: false })
        .limit(50);

      if (tasksData) setCompletedTasks(tasksData as any);

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
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
        ${activeTab === id 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History & Insights</h1>
          <p className="text-muted-foreground">
            Track activity, task performance, and service usage in {currentSpace?.name}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-muted/50 p-1 rounded-full w-fit">
          <TabButton id="all" label="All Activity" icon={Activity} />
          <TabButton id="tasks" label="Tasks" icon={CheckCircle2} />
          <TabButton id="services" label="Services" icon={Clock} />
          <TabButton id="performance" label="Performance" icon={User} />
        </div>
      </div>

      {/* ALL ACTIVITY TAB */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Recent Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-muted ml-3 space-y-8 py-2">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity recorded yet.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="relative pl-8">
                      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            <span className="font-bold text-primary">{log.profile?.username || 'Unknown'}</span>
                            {' '}{log.action.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {JSON.stringify(log.details)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="grid gap-4">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No completed tasks found.
                </CardContent>
              </Card>
            ) : (
              completedTasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <div className="flex items-center p-4 gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{task.title}</h3>
                        <Badge variant="outline" className="ml-2">
                          {task.difficulty} pts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Completed by <span className="font-medium text-foreground">{task.assignee?.username}</span></span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(task.updated_at || task.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {task.proof_image_url && (
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img src={task.proof_image_url} alt="Proof" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="grid gap-4">
            {serviceHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No service history found.
                </CardContent>
              </Card>
            ) : (
              serviceHistory.map((service) => (
                <Card key={service.id}>
                  <div className="flex items-center p-4 gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      service.status === 'completed' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {service.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
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
              ))
            )}
          </div>
        </div>
      )}

      {/* PERFORMANCE TAB */}
      {activeTab === 'performance' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            // Calculate stats for this member from the loaded data
            // Note: In a real app, we might want to fetch aggregated stats from the DB
            const memberTasks = completedTasks.filter(t => t.assigned_to === member.user_id);
            const memberServices = serviceHistory.filter(s => s.user_id === member.user_id);
            
            return (
              <Card key={member.user_id} className="overflow-hidden">
                <div className="bg-muted/30 p-4 flex items-center gap-3 border-b">
                  <Avatar className="h-10 w-10">
                    {member.profile?.avatar_url ? (
                      <AvatarImage src={member.profile.avatar_url} />
                    ) : (
                      <AvatarFallback>{member.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{member.profile?.username}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xl font-bold text-primary">{member.points}</span>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
                  </div>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Tasks Done</p>
                      <p className="text-lg font-medium">{memberTasks.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Services Used</p>
                      <p className="text-lg font-medium">{memberServices.length}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Recent Activity</p>
                    <div className="space-y-2">
                      {memberTasks.slice(0, 2).map(t => (
                        <div key={t.id} className="text-xs flex justify-between items-center bg-muted/50 p-2 rounded">
                          <span className="truncate max-w-[120px]">{t.title}</span>
                          <span className="text-muted-foreground">{formatDistanceToNow(new Date(t.updated_at || t.created_at))} ago</span>
                        </div>
                      ))}
                      {memberTasks.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No recent tasks</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
