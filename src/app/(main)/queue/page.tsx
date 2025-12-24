"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Clock, 
  ArrowUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Timer,
  Award,
  ChevronUp,
  Info
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ServiceQueue, QueueStatus, TASK_CATEGORIES, Service } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";

export default function QueuePage() {
  const { user, currentSpace } = useAuth();
  const [loading, setLoading] = useState(true);
  const [queueEntries, setQueueEntries] = useState<ServiceQueue[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [myEntry, setMyEntry] = useState<ServiceQueue | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  
  // Form state
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentSpace && user) {
      fetchQueue();
      fetchServices();
      const interval = setInterval(fetchQueue, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [currentSpace, user]);

  const fetchServices = async () => {
    if (!currentSpace) return;
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('space_id', currentSpace.id)
      .eq('is_active', true);
    
    if (data) {
      setAvailableServices(data);
      if (data.length > 0) setServiceType(data[0].name);
    }
  };

  const fetchQueue = async () => {
    if (!currentSpace || !user) return;
    
    try {
      // Fetch all queue entries
      const { data: entries, error: entriesError } = await supabase
        .from('service_queue')
        .select(`
          *,
          profile:profiles!service_queue_user_id_fkey(*)
        `)
        .eq('space_id', currentSpace.id)
        .in('status', ['queued', 'in_service'])
        .order('queue_position', { ascending: true });

      if (entriesError) throw entriesError;
      setQueueEntries(entries || []);

      // Find my entry
      const mine = entries?.find(e => e.user_id === user.id && e.status === 'queued');
      setMyEntry(mine || null);

      // Get queue status
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_queue_status', { p_space_id: currentSpace.id });

      if (!statusError && statusData) {
        setQueueStatus(statusData);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace || !user) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('join_service_queue', {
        p_space_id: currentSpace.id,
        p_service_type: serviceType,
        p_description: description || null,
        p_urgency: urgency
      });

      if (error) throw error;

      toast.success('Successfully joined the queue!');
      setShowJoinForm(false);
      setDescription('');
      fetchQueue();
    } catch (error: any) {
      console.error('Error joining queue:', error);
      toast.error(error.message || 'Failed to join queue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUsePrioritySkip = async (positions: number) => {
    if (!myEntry) return;

    try {
      const { data, error } = await supabase.rpc('use_priority_skip', {
        p_queue_entry_id: myEntry.id,
        p_positions_to_skip: positions
      });

      if (error) throw error;

      toast.success(`Moved ahead ${positions} position${positions > 1 ? 's' : ''}!`);
      fetchQueue();
    } catch (error: any) {
      console.error('Error using priority skip:', error);
      toast.error(error.message || 'Failed to use priority skip');
    }
  };

  const handleCancelQueue = async () => {
    if (!myEntry) return;

    try {
      const { error } = await supabase
        .from('service_queue')
        .update({ status: 'cancelled' })
        .eq('id', myEntry.id);

      if (error) throw error;

      toast.success('Left the queue');
      fetchQueue();
    } catch (error: any) {
      console.error('Error cancelling queue:', error);
      toast.error(error.message || 'Failed to cancel');
    }
  };

  const getServiceDisplay = (name: string) => {
    const key = Object.keys(TASK_CATEGORIES).find(k => k.toLowerCase() === name.toLowerCase());
    if (key) return TASK_CATEGORIES[key as keyof typeof TASK_CATEGORIES];
    return { label: name, emoji: '📋' };
  };

  const getUrgencyColor = (urg: string) => {
    switch (urg) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8">
      {/* Header */}
      <SlideInCard direction="down">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Service Queue</h1>
            <p className="text-muted-foreground font-bold mt-2">
              Join the queue for cleaning services with priority options
            </p>
          </div>
          {!myEntry && (
            <Button 
              size="lg" 
              onClick={() => setShowJoinForm(!showJoinForm)}
              className="rounded-xl gap-2 px-6 h-12 font-bold"
            >
              <Users className="h-5 w-5" />
              Join Queue
            </Button>
          )}
        </div>
      </SlideInCard>

      {/* Queue Status */}
      {queueStatus && (
        <SlideInCard direction="up" delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{queueStatus.total_queued}</p>
                    <p className="text-sm text-muted-foreground font-semibold">In Queue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{queueStatus.in_service}</p>
                    <p className="text-sm text-muted-foreground font-semibold">In Service</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{queueStatus.avg_wait_minutes}</p>
                    <p className="text-sm text-muted-foreground font-semibold">Avg Wait (min)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{queueStatus.spots_available}</p>
                    <p className="text-sm text-muted-foreground font-semibold">Spots Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SlideInCard>
      )}

      {/* Join Queue Form */}
      <AnimatePresence>
        {showJoinForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SlideInCard direction="up" delay={0.15}>
              <Card className="border-0 shadow-xl rounded-[2rem]">
                <CardHeader>
                  <CardTitle>Join Service Queue</CardTitle>
                  <CardDescription>Request a cleaning service</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoinQueue} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Service Type</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableServices.length > 0 ? (
                          availableServices.map((service) => {
                            const display = getServiceDisplay(service.name);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => setServiceType(service.name)}
                                className={`p-4 rounded-xl text-left transition-all ${
                                  serviceType === service.name
                                    ? 'bg-primary/10 ring-2 ring-primary'
                                    : 'bg-muted/50 hover:bg-muted'
                                }`}
                              >
                                <span className="text-2xl mb-2 block">{display.emoji}</span>
                                <p className="font-bold text-sm">{service.name}</p>
                                {service.points_reward > 0 && (
                                  <p className="text-xs text-muted-foreground">+{service.points_reward} pts</p>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="col-span-4 text-center py-4 text-muted-foreground">
                            No services available. Please contact admin.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-bold">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl"
                        placeholder="Specific area or additional details..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Urgency Level</Label>
                      <div className="grid grid-cols-4 gap-3">
                        {['low', 'normal', 'high', 'urgent'].map((urg) => (
                          <button
                            key={urg}
                            type="button"
                            onClick={() => setUrgency(urg as any)}
                            className={`p-3 rounded-xl capitalize transition-all ${
                              urgency === urg
                                ? 'bg-primary/10 ring-2 ring-primary'
                                : 'bg-muted/50 hover:bg-muted'
                            }`}
                          >
                            <p className="font-bold text-sm">{urg}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={submitting}
                        className="rounded-xl gap-2 flex-1"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4" />
                            Join Queue
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowJoinForm(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </SlideInCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Queue Entry */}
      {myEntry && (
        <SlideInCard direction="up" delay={0.2}>
          <Card className="border-0 shadow-xl rounded-[2rem] bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Your Queue Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Position in Queue</p>
                  <p className="text-5xl font-black text-primary">#{myEntry.queue_position}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Estimated Wait</p>
                  <p className="text-3xl font-bold">{myEntry.estimated_wait_minutes || 0} min</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-background/50">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Service Type</p>
                  <p className="font-bold">{TASK_CATEGORIES[myEntry.service_type as keyof typeof TASK_CATEGORIES]?.label || myEntry.service_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Urgency</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(myEntry.urgency)}`}>
                    {myEntry.urgency}
                  </span>
                </div>
              </div>

              {/* Priority Skip Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <ChevronUp className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-bold text-sm">Priority Skips Available</p>
                      <p className="text-xs text-muted-foreground">
                        {myEntry.priority_skips_available - myEntry.priority_skips_used} of {myEntry.priority_skips_available} remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 5].map((count) => (
                      <Button
                        key={count}
                        size="sm"
                        variant="outline"
                        onClick={() => handleUsePrioritySkip(count)}
                        disabled={myEntry.priority_skips_used + count > myEntry.priority_skips_available || myEntry.queue_position <= count}
                        className="rounded-xl h-9 px-3"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{count}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Use priority skips to move ahead in the queue. Each skip moves you forward one position. 
                    Skips reset monthly.
                  </p>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleCancelQueue}
                className="w-full rounded-xl gap-2"
              >
                <XCircle className="h-4 w-4" />
                Leave Queue
              </Button>
            </CardContent>
          </Card>
        </SlideInCard>
      )}

      {/* Current Queue */}
      <SlideInCard direction="up" delay={0.25}>
        <Card className="border-0 shadow-xl rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Queue
            </CardTitle>
            <CardDescription>See who's waiting for service</CardDescription>
          </CardHeader>
          <CardContent>
            {queueEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-lg mb-2">Queue is Empty</p>
                <p className="text-muted-foreground text-sm">Be the first to join!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queueEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      entry.status === 'in_service'
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                        : entry.user_id === user?.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl font-black text-xl flex items-center justify-center ${
                          entry.status === 'in_service'
                            ? 'bg-green-500 text-white'
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {entry.status === 'in_service' ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            `#${entry.queue_position}`
                          )}
                        </div>
                        <div>
                          <p className="font-bold">
                            {entry.profile?.username || entry.profile?.full_name || 'Anonymous'}
                            {entry.user_id === user?.id && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {TASK_CATEGORIES[entry.service_type as keyof typeof TASK_CATEGORIES]?.emoji}{' '}
                            {TASK_CATEGORIES[entry.service_type as keyof typeof TASK_CATEGORIES]?.label || entry.service_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(entry.urgency)}`}>
                          {entry.urgency}
                        </span>
                        {entry.estimated_wait_minutes != null && entry.status === 'queued' && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-end gap-1">
                            <Timer className="h-3 w-3" />
                            ~{entry.estimated_wait_minutes} min
                          </p>
                        )}
                        {entry.status === 'in_service' && (
                          <p className="text-xs text-green-600 font-bold mt-2">In Service</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </SlideInCard>
    </div>
  );
}
