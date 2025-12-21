'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  User
} from 'lucide-react';
import { Feedback, FeedbackComment, FeedbackStatus, FeedbackPriority } from '@/types';
import { toast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Admin session (cookie)
        const s = await fetch('/api/admin/session', { cache: 'no-store' });
        const sd = (await s.json().catch(() => null)) as any;
        const ok = Boolean(sd?.authenticated);
        setIsAdminAuthed(ok);
        if (!ok) return;

        // Get user_id for admin replies.
        // If not logged-in to Supabase Auth, we can still view feedback, but replies will be disabled.
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);

        await fetchFeedback();
      } catch {
        setIsAdminAuthed(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedFeedback) {
      fetchComments(selectedFeedback.id);
    }
  }, [selectedFeedback]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feedback', { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load feedback');
      }
      setFeedback((json?.data as Feedback[]) || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to load feedback');
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}/comments`, { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error || 'Failed to load comments');
      setComments((json?.data as FeedbackComment[]) || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const updateStatus = async (feedbackId: string, status: FeedbackStatus) => {
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error || 'Failed to update status');
      
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const updatePriority = async (feedbackId: string, priority: FeedbackPriority) => {
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error || 'Failed to update priority');
      
      toast.success(`Priority updated to ${priority}`);
      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, priority });
      }
    } catch (err) {
      console.error('Error updating priority:', err);
      toast.error('Failed to update priority');
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedFeedback || !userId) return;

    try {
      const res = await fetch(`/api/admin/feedback/${selectedFeedback.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ comment: newComment, user_id: userId }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error || 'Failed to add response');

      setNewComment('');
      fetchComments(selectedFeedback.id);
      toast.success('Response added');
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add response');
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error || 'Failed to delete feedback');

      toast.success('Feedback deleted');
      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback(null);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      toast.error('Failed to delete feedback');
    }
  };

  const getStatusIcon = (status: FeedbackStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredFeedback = feedback.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdminAuthed) {
    return (
      <div className="max-w-3xl">
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle>Admin session required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please unlock the admin portal first. If you still see this message, set
            <span className="font-mono"> ADMIN_PORTAL_PASSWORD</span> in <span className="font-mono">.env.local</span>.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-80 lg:w-96 border-r bg-background flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Feedback</h1>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
              {feedback.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search feedback..." 
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredFeedback.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No feedback found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredFeedback.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedFeedback(item)}
                  className={`w-full p-4 text-left transition-colors hover:bg-muted/50 flex gap-3 ${
                    selectedFeedback?.id === item.id ? 'bg-primary/5 border-r-2 border-r-primary' : ''
                  }`}
                >
                  <div className="mt-1">
                    {item.type === 'issue' ? '🐛' : '💡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium uppercase">
                        {getStatusIcon(item.status)}
                        <span>{item.status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] font-medium">👍 {item.vote_count}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 bg-muted/10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedFeedback ? (
            <motion.div
              key={selectedFeedback.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 max-w-4xl mx-auto"
            >
              <Card className="mb-6">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedFeedback.type === 'issue' ? '🐛' : '💡'}</span>
                        <CardTitle className="text-2xl">{selectedFeedback.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {selectedFeedback.profile?.full_name || selectedFeedback.profile?.username || 'Anonymous'}
                        </div>
                        <span>•</span>
                        <span>{new Date(selectedFeedback.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteFeedback(selectedFeedback.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed">
                    {selectedFeedback.description}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                      <select
                        value={selectedFeedback.status}
                        onChange={(e) => updateStatus(selectedFeedback.id, e.target.value as FeedbackStatus)}
                        className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Priority</label>
                      <select
                        value={selectedFeedback.priority}
                        onChange={(e) => updatePriority(selectedFeedback.id, e.target.value as FeedbackPriority)}
                        className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Responses ({comments.length})
                </h3>
                
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-xl ${
                        comment.is_admin_response
                          ? 'bg-primary/5 border border-primary/10 ml-8'
                          : 'bg-background border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                            {comment.profile?.username?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <span className="text-xs font-bold">
                            {comment.profile?.full_name || comment.profile?.username || 'Anonymous'}
                          </span>
                          {comment.is_admin_response && (
                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.comment}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <Button onClick={addComment}>
                    Reply
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="bg-muted/50 p-6 rounded-full mb-4">
                <MessageSquare className="h-12 w-12 opacity-20" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Select Feedback</h2>
              <p className="max-w-xs">Choose a feedback item from the list to view details and respond.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
