'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback, FeedbackType, FeedbackStatus } from '@/types';

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

      // Get vote counts and user votes
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

      // Sort
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
      alert('Please log in to vote');
      return;
    }

    try {
      if (currentVote) {
        // Remove vote
        await supabase
          .from('feedback_votes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', userId);
      } else {
        // Add vote
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

    const labels = {
      pending: 'Pending',
      under_review: 'Under Review',
      planned: 'Planned',
      in_progress: 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Feedback & Feature Requests</h1>
        <Button onClick={() => router.push('/feedback/submit')}>
          Submit Feedback
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === 'feature' ? 'default' : 'outline'}
                onClick={() => setFilter('feature')}
                size="sm"
              >
                💡 Features
              </Button>
              <Button
                variant={filter === 'issue' ? 'default' : 'outline'}
                onClick={() => setFilter('issue')}
                size="sm"
              >
                🐛 Issues
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'votes' ? 'default' : 'outline'}
                onClick={() => setSortBy('votes')}
                size="sm"
              >
                Most Voted
              </Button>
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                onClick={() => setSortBy('recent')}
                size="sm"
              >
                Most Recent
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No feedback found. Be the first to submit!
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex gap-4">
                {/* Vote Button */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleVote(item.id, item.user_vote || false)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.user_vote
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold mt-1">
                    {item.vote_count || 0}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">
                          {item.type === 'feature' ? '💡' : '🐛'}
                        </span>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-4">
                    {getStatusBadge(item.status)}
                    <span>
                      by {item.profile?.username || 'Anonymous'}
                    </span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
