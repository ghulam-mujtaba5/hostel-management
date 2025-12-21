'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Feedback, FeedbackType, FeedbackStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, ThumbsUp } from 'lucide-react';
import { SlideInCard } from '@/components/Animations';
import { toast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';

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
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      under_review: 'bg-blue-100 text-blue-800',
      planned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-muted-foreground text-sm">Help us improve your hostel experience.</p>
        </div>
        <Button onClick={() => router.push('/feedback/submit')} className="gap-2">
          <Plus className="h-4 w-4" />
          Submit
        </Button>
      </div>

      <SlideInCard direction="up" delay={0}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                  className="rounded-full"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'feature' ? 'default' : 'outline'}
                  onClick={() => setFilter('feature')}
                  size="sm"
                  className="rounded-full"
                >
                  💡 Features
                </Button>
                <Button
                  variant={filter === 'issue' ? 'default' : 'outline'}
                  onClick={() => setFilter('issue')}
                  size="sm"
                  className="rounded-full"
                >
                  🐛 Issues
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-muted/50 border-none rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-1 ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>

                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg ml-auto">
                  <Button
                    variant={sortBy === 'votes' ? 'secondary' : 'ghost'}
                    onClick={() => setSortBy('votes')}
                    size="sm"
                    className="h-7 text-[10px] px-2"
                  >
                    Top
                  </Button>
                  <Button
                    variant={sortBy === 'recent' ? 'secondary' : 'ghost'}
                    onClick={() => setSortBy('recent')}
                    size="sm"
                    className="h-7 text-[10px] px-2"
                  >
                    New
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : feedback.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No feedback yet"
            description="Be the first to share ideas, report issues, or give suggestions for this space!"
            action={{ label: 'Submit Feedback', href: '/feedback/submit' }}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {feedback.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleVote(item.id, item.user_vote || false)}
                          className={`p-2 rounded-xl transition-all ${
                            item.user_vote
                              ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <ThumbsUp className={`h-5 w-5 ${item.user_vote ? 'fill-current' : ''}`} />
                        </button>
                        <span className="text-xs font-bold">
                          {item.vote_count || 0}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {item.type === 'feature' ? '💡' : '🐛'}
                          </span>
                          <h3 className="font-bold truncate">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(item.status)}
                            <span className="text-[10px] text-muted-foreground">
                              by {item.profile?.username || 'Anonymous'}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
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
