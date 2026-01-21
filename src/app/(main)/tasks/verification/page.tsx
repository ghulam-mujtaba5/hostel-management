"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, AlertCircle, User, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";

export default function VerificationPage() {
  const { user, currentSpace, spaceMembership, loading: authLoading } = useAuth();
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    if (currentSpace && spaceMembership?.role === 'admin') {
      fetchPendingTasks();
    }
  }, [currentSpace, spaceMembership]);

  const fetchPendingTasks = async () => {
    if (!currentSpace) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assigned_to_fkey(*),
          creator:profiles!tasks_created_by_fkey(*)
        `)
        .eq('space_id', currentSpace.id)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });

      if (data) setPendingTasks(data);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      toast.error('Failed to load pending tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (taskId: string, approved: boolean) => {
    if (verifying) return;

    setVerifying(taskId);
    try {
      const { error } = await supabase.rpc('verify_task', {
        task_id: taskId,
        approved,
      });

      if (error) {
        toast.error(error.message || 'Verification failed');
        return;
      }

      toast.success(
        approved 
          ? 'Task approved! Points awarded.' 
          : 'Proof rejected. Task sent back for redo.'
      );
      fetchPendingTasks();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  // Check authorization
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Please sign in to access verification</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Please select a space first</p>
        <Button asChild className="mt-4">
          <Link href="/spaces">Go to Spaces</Link>
        </Button>
      </div>
    );
  }

  if (spaceMembership?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Admin Only</h2>
        <p className="text-muted-foreground">Only space admins can verify tasks</p>
        <Button asChild className="mt-4">
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Verify Proofs</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve task completions from your team
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : pendingTasks.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-bold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No pending verifications. All tasks are either completed or in progress.
            </p>
            <Button asChild className="mt-4">
              <Link href="/tasks">View All Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">
            {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} waiting for approval
          </div>

          <AnimatePresence>
            {pendingTasks.map((task, index) => {
              const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.other;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-primary/30 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Task Info */}
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                            {category.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{task.assignee?.username || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                              </div>
                              <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                                +{task.difficulty} pts
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Proof Image */}
                        {task.proof_image_url && (
                          <div className="rounded-xl overflow-hidden bg-muted/50 p-2">
                            <img
                              src={task.proof_image_url}
                              alt="Task proof"
                              className="w-full rounded-lg max-h-96 object-cover"
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleVerify(task.id, false)}
                            disabled={verifying === task.id}
                          >
                            {verifying === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Reject
                          </Button>
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleVerify(task.id, true)}
                            disabled={verifying === task.id}
                          >
                            {verifying === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
