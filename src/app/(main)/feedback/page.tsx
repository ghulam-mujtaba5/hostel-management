'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Feedback, FeedbackType, FeedbackStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, ThumbsUp, Sparkles, Bug, Lightbulb, ChevronDown, Filter, TrendingUp, Clock } from 'lucide-react';
import { SlideInCard } from '@/components/Animations';
import { toast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/utils';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | FeedbackType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'votes'>('votes');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
    getCurrentUser();
  }, [filter, statusFilter, sortBy]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchFeedback = async () => {
    try {
      let query = supabase
        .from('feedback')
        .select(`
          *,
          profile:user_id(username, avatar_url)
        `);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const feedbackWithVotes = await Promise.all(
        (data || []).map(async (item) => {
          const { count } = await supabase
            .from('feedback_votes')
            .select('*', { count: 'exact', head: true })
            .eq('feedback_id', item.id);

          const { data: { user } } = await supabase.auth.getUser();
          let userVote = false;
          if (user) {
            const { data: voteData } = await supabase
              .from('feedback_votes')
              .select('id')
              .eq('feedback_id', item.id)
              .eq('user_id', user.id)
              .single();
            userVote = !!voteData;
          }

          return {
            ...item,
            vote_count: count || 0,
            user_vote: userVote
          };
        })
      );

      const sorted = feedbackWithVotes.sort((a, b) => {
        if (sortBy === 'votes') {
          return (b.vote_count || 0) - (a.vote_count || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setFeedback(sorted);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (feedbackId: string, currentVote: boolean) => {
    if (!userId) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      if (currentVote) {
        await supabase
          .from('feedback_votes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('feedback_votes')
          .insert({
            feedback_id: feedbackId,
            user_id: userId
          });
      }

      fetchFeedback();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    const styles: Record<FeedbackStatus, string> = {
      pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      planned: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    };

    return (
      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status])}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider"
            >
              <MessageSquare className="h-3 w-3" />
              Community Feedback
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Feature <br />
              <span className="text-primary">Requests</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Help us improve your hostel experience. Share ideas and report issues.
            </p>
          </div>

          <Button 
            onClick={() => router.push('/feedback/submit')} 
            size="lg" 
            className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all group"
          >
            <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
            Submit Feedback
          </Button>
        </div>
      </div>

      {/* Filters */}
      <SlideInCard direction="up" delay={0.1}>
        <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Type Filter */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all' as const, label: 'All', icon: Filter },
                  { key: 'feature' as const, label: 'Features', icon: Lightbulb },
                  { key: 'issue' as const, label: 'Issues', icon: Bug },
                ].map((item) => (
                  <Button
                    key={item.key}
                    variant={filter === item.key ? 'default' : 'outline'}
                    onClick={() => setFilter(item.key)}
                    size="sm"
                    className={cn(
                      "rounded-xl h-10 px-4 font-bold",
                      filter === item.key 
                        ? "shadow-md shadow-primary/20" 
                        : "border-border/50 bg-transparent hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-4 md:ml-auto">
                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="appearance-none bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-2 ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Sort Buttons */}
                <div className="flex p-1 bg-muted/30 border border-border/50 rounded-xl">
                  <button
                    onClick={() => setSortBy('votes')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                      sortBy === 'votes' 
                        ? "bg-white dark:bg-slate-800 text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <TrendingUp className="h-3 w-3" />
                    Top
                  </button>
                  <button
                    onClick={() => setSortBy('recent')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                      sortBy === 'recent' 
                        ? "bg-white dark:bg-slate-800 text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    New
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <SlideInCard direction="up" delay={0.2}>
            <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem]">
              <CardContent className="py-20 text-center">
                <div className="h-20 w-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No feedback yet</h3>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
                  Be the first to share ideas, report issues, or give suggestions for this space!
                </p>
                <Button 
                  onClick={() => router.push('/feedback/submit')}
                  className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </SlideInCard>
        ) : (
          <AnimatePresence mode="popLayout">
            {feedback.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-2xl hover:border-primary/20 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex gap-5">
                      {/* Vote Button */}
                      <div className="flex flex-col items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleVote(item.id, item.user_vote || false)}
                          className={cn(
                            "h-14 w-14 rounded-xl flex items-center justify-center transition-all",
                            item.user_vote
                              ? 'bg-primary text-white shadow-lg shadow-primary/30'
                              : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <ThumbsUp className={cn("h-6 w-6", item.user_vote && "fill-current")} />
                        </motion.button>
                        <span className={cn(
                          "text-sm font-bold",
                          item.user_vote ? "text-primary" : "text-muted-foreground"
                        )}>
                          {item.vote_count || 0}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            item.type === 'feature' 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          )}>
                            {item.type === 'feature' ? (
                              <Lightbulb className="h-5 w-5" />
                            ) : (
                              <Bug className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(item.status)}
                            <span className="text-xs text-muted-foreground font-medium">
                              by <span className="font-bold text-foreground">{item.profile?.username || 'Anonymous'}</span>
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {new Date(item.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
