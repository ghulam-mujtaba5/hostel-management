'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Feedback, FeedbackComment, FeedbackStatus, FeedbackPriority } from '@/types';

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
    fetchFeedback();
  }, []);

  useEffect(() => {
    if (selectedFeedback) {
      fetchComments(selectedFeedback.id);
    }
  }, [selectedFeedback]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    // In production, check if user is admin from database
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          profile:user_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get vote counts
      const feedbackWithVotes = await Promise.all(
        (data || []).map(async (item) => {
          const { count } = await supabase
            .from('feedback_votes')
            .select('*', { count: 'exact', head: true })
            .eq('feedback_id', item.id);

          return {
            ...item,
            vote_count: count || 0
          };
        })
      );

      setFeedback(feedbackWithVotes);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (feedbackId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback_comments')
        .select(`
          *,
          profile:user_id(username, avatar_url)
        `)
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const updateStatus = async (feedbackId: string, status: FeedbackStatus) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', feedbackId);

      if (error) throw error;
      
      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const updatePriority = async (feedbackId: string, priority: FeedbackPriority) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ priority })
        .eq('id', feedbackId);

      if (error) throw error;
      
      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, priority });
      }
    } catch (err) {
      console.error('Error updating priority:', err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedFeedback || !userId) return;

    try {
      const { error } = await supabase
        .from('feedback_comments')
        .insert({
          feedback_id: selectedFeedback.id,
          user_id: userId,
          comment: newComment,
          is_admin_response: true
        });

      if (error) throw error;

      setNewComment('');
      fetchComments(selectedFeedback.id);
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;

      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback(null);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
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

    return styles[status] || styles.pending;
  };

  const getPriorityBadge = (priority: FeedbackPriority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return styles[priority] || styles.normal;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Feedback List */}
      <div className="w-1/3 border-r overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Feedback Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold">{feedback.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </Card>
        </div>

        {/* Feedback Items */}
        <div className="space-y-2">
          {feedback.map((item) => (
            <Card
              key={item.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedFeedback?.id === item.id
                  ? 'bg-blue-50 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {item.type === 'feature' ? '💡' : '🐛'}
                  </span>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                </div>
                <span className="text-xs font-medium">
                  👍 {item.vote_count || 0}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${getStatusBadge(item.status)}`}>
                  {item.status}
                </span>
                <span className={`px-2 py-1 rounded-full ${getPriorityBadge(item.priority)}`}>
                  {item.priority}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Feedback Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedFeedback ? (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">
                    {selectedFeedback.type === 'feature' ? '💡' : '🐛'}
                  </span>
                  <h2 className="text-2xl font-bold">{selectedFeedback.title}</h2>
                </div>
                <p className="text-gray-600 mb-4">{selectedFeedback.description}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>by {selectedFeedback.profile?.username || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{new Date(selectedFeedback.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>👍 {selectedFeedback.vote_count || 0} votes</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => deleteFeedback(selectedFeedback.id)}
                className="text-red-600"
              >
                Delete
              </Button>
            </div>

            {/* Status & Priority Controls */}
            <Card className="p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={selectedFeedback.status}
                    onChange={(e) => updateStatus(selectedFeedback.id, e.target.value as FeedbackStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={selectedFeedback.priority}
                    onChange={(e) => updatePriority(selectedFeedback.id, e.target.value as FeedbackPriority)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Comments */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Admin Comments</h3>
              
              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg ${
                      comment.is_admin_response
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">
                        {comment.profile?.username || 'Anonymous'}
                      </span>
                      {comment.is_admin_response && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          Admin
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add admin response..."
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <Button onClick={addComment}>
                  Send
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a feedback item to view details
          </div>
        )}
      </div>
    </div>
  );
}
