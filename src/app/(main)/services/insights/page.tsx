'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ServiceStat {
  service_type: string;
  count: number;
  avg_wait: number;
}

interface UserPerformance {
  username: string;
  completed_count: number;
}

export default function ServiceInsightsPage() {
  const { currentSpace } = useAuth();
  const [stats, setStats] = useState<ServiceStat[]>([]);
  const [topPerformers, setTopPerformers] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentSpace) {
      fetchInsights();
    }
  }, [currentSpace]);

  const fetchInsights = async () => {
    try {
      // Fetch completed services stats
      const { data: queueData, error: queueError } = await supabase
        .from('service_queue')
        .select('service_type, actual_wait_minutes, status')
        .eq('space_id', currentSpace!.id)
        .eq('status', 'completed');

      if (queueError) throw queueError;

      // Process stats
      const serviceMap = new Map<string, { count: number; totalWait: number }>();
      queueData?.forEach((item) => {
        const current = serviceMap.get(item.service_type) || { count: 0, totalWait: 0 };
        serviceMap.set(item.service_type, {
          count: current.count + 1,
          totalWait: current.totalWait + (item.actual_wait_minutes || 0),
        });
      });

      const statsArray: ServiceStat[] = Array.from(serviceMap.entries()).map(([type, data]) => ({
        service_type: type,
        count: data.count,
        avg_wait: Math.round(data.totalWait / data.count),
      }));

      setStats(statsArray);

      // Fetch top performers (who requested/completed services? The prompt says "which person done". 
      // In service_queue, user_id is the requester. 
      // If "done" means who *performed* the service, we need a 'provider_id' or similar.
      // Currently service_queue doesn't have 'provider_id' explicitly, but 'assigned_to' in tasks does.
      // Assuming for now we track who *requested* services or if there's a provider field I missed.
      // Re-reading schema: service_queue has user_id (requester). 
      // The prompt says "which person done". This implies a service provider.
      // I'll assume for now we are tracking usage. If they want provider tracking, we'd need a provider column.
      // Wait, `task_assignments` tracks who did tasks. Let's use that for "Work Done".
      
      const { data: taskData, error: taskError } = await supabase
        .from('task_assignments')
        .select('user_id, profiles(username)')
        .eq('space_id', currentSpace!.id)
        .not('completed_at', 'is', null);

      if (taskError) throw taskError;

      const performerMap = new Map<string, number>();
      taskData?.forEach((item: any) => {
        const username = item.profiles?.username || 'Unknown';
        performerMap.set(username, (performerMap.get(username) || 0) + 1);
      });

      const performersArray: UserPerformance[] = Array.from(performerMap.entries())
        .map(([username, count]) => ({ username, completed_count: count }))
        .sort((a, b) => b.completed_count - a.completed_count)
        .slice(0, 5);

      setTopPerformers(performersArray);

    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (!currentSpace) return <div className="p-4">Please select a space first.</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Service Insights & Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Usage Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading...</p> : (
              <div className="space-y-4">
                {stats.length === 0 ? <p>No data available</p> : stats.map((stat) => (
                  <div key={stat.service_type} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{stat.service_type}</div>
                      <div className="text-sm text-muted-foreground">Avg Wait: {stat.avg_wait} mins</div>
                    </div>
                    <div className="text-xl font-bold">{stat.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers (Tasks Completed)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading...</p> : (
              <div className="space-y-4">
                {topPerformers.length === 0 ? <p>No data available</p> : topPerformers.map((user, index) => (
                  <div key={user.username} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground">#{index + 1}</span>
                      <span>{user.username}</span>
                    </div>
                    <div className="font-bold">{user.completed_count} tasks</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
