"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Check, Clock, Upload, User, AlertTriangle, Sparkles, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, getDifficultyLabel, getDifficultyColor } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";
import { useCelebration } from "@/components/Celebrations";
import { toast } from "@/components/Toast";
import { getErrorMessage, parseSupabaseError } from "@/lib/errorMessages";
import { LoadingButton } from "@/components/LoadingButton";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, currentSpace } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [taking, setTaking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { celebrate, CelebrationComponent } = useCelebration();

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*),
        creator:profiles!tasks_created_by_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (data) setTask(data);
    setLoading(false);
  };

  const handleTakeTask = async () => {
    if (!task || !user) return;

    setTaking(true);
    try {
      const { error } = await supabase.rpc('take_task', { task_id: task.id });
      if (error) {
        const errorCode = parseSupabaseError(error);
        const errorMsg = getErrorMessage(errorCode);
        toast.error(`${errorMsg.title}: ${errorMsg.message}`);
        return;
      }

      toast.taskTaken(task.title);
      celebrate('task_taken');
      fetchTask();
    } catch (err) {
      const errorMsg = getErrorMessage('NETWORK_ERROR');
      toast.error(`${errorMsg.title}: ${errorMsg.message}`);
    } finally {
      setTaking(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}-${Date.now()}.${fileExt}`;
      const filePath = `${task.space_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath);

      const { error } = await supabase.rpc('submit_task_proof', {
        task_id: task.id,
        proof_image_url: publicUrl,
      });

      if (error) throw error;

      toast.success('Proof uploaded! Waiting for verification.', { emoji: '📸' });
      fetchTask();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (approved: boolean) => {
    if (!task || !user || !currentSpace) return;

    setVerifying(true);
    try {
      const { error } = await supabase.rpc('verify_task', {
        task_id: task.id,
        approved,
      });

      if (error) {
        const errorCode = parseSupabaseError(error);
        const errorMsg = getErrorMessage(errorCode);
        toast.error(`${errorMsg.title}: ${errorMsg.message}`);
        return;
      }

      if (approved) {
        celebrate('task_completed', { points: task.difficulty });
        toast.taskCompleted(task.title, task.difficulty);
      } else {
        toast.error('Proof rejected. Task sent back for redo.');
      }

      fetchTask();
    } catch (err) {
      const errorMsg = getErrorMessage('NETWORK_ERROR');
      toast.error(`${errorMsg.title}: ${errorMsg.message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button asChild className="mt-4">
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.other;
  const isAssignedToMe = task.assigned_to === user?.id;
  const canVerify = task.status === 'pending_verification' && !isAssignedToMe;

  const statusConfig = {
    done: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', label: 'Completed' },
    pending_verification: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', label: 'Pending Verification' },
    in_progress: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', label: 'In Progress' },
    todo: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200', label: 'To Do' },
  };

  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;

  return (
    <div className="space-y-6">
      {CelebrationComponent}
      
      <SlideInCard direction="down" delay={0}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl">
            <Link href="/tasks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {task.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created by {task.creator?.full_name || task.creator?.username || 'Unknown'} • {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </SlideInCard>

      {/* Status Card */}
      <SlideInCard direction="up" delay={0.1}>
        <Card className="overflow-hidden">
          <div className={`h-2 ${
            task.status === 'done' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
            task.status === 'pending_verification' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
            task.status === 'in_progress' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
            'bg-gradient-to-r from-gray-300 to-gray-400'
          }`} />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.span 
                  className="text-3xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  {category.emoji}
                </motion.span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${category.color}`}>
                  {category.label}
                </span>
              </div>
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}
              >
                {getDifficultyLabel(task.difficulty)} • {task.difficulty} pts
              </motion.span>
            </div>

            {task.description && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mb-4 bg-muted/50 p-3 rounded-lg"
              >
                {task.description}
              </motion.p>
            )}

            <div className="space-y-3 text-sm">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium">
                  {task.assignee 
                    ? `${task.assignee.username || task.assignee.full_name}`
                    : 'Unassigned'}
                </span>
              </motion.div>
              
              {task.due_date && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span>Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                </motion.div>
              )}
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                className="flex items-center gap-2"
              >
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Proof Image */}
      <AnimatePresence>
        {task.proof_image_url && (
          <SlideInCard direction="up" delay={0.2}>
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Proof Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-xl overflow-hidden"
                >
                  <img 
                    src={task.proof_image_url} 
                    alt="Task proof" 
                    className="w-full rounded-xl shadow-lg"
                  />
                  {task.status === 'pending_verification' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <p className="text-white p-4 text-sm font-medium">
                        ⏳ Waiting for someone to verify this...
                      </p>
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </SlideInCard>
        )}
      </AnimatePresence>

      {/* Actions */}
      <SlideInCard direction="up" delay={0.3}>
        <div className="space-y-3">
          {/* Take Task */}
          {!task.assigned_to && task.status === 'todo' && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <LoadingButton 
                className="w-full h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-base min-h-[56px]" 
                size="lg" 
                onClick={handleTakeTask}
                loading={taking}
                loadingText="Taking task..."
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Take This Task
              </LoadingButton>
            </motion.div>
          )}

          {/* Upload Proof */}
          {isAssignedToMe && (task.status === 'in_progress' || task.status === 'todo') && (
            <div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleUploadProof}
                className="hidden"
                id="proof-upload"
                disabled={uploading}
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-base" 
                  size="lg" 
                  asChild
                  disabled={uploading}
                >
                  <label htmlFor="proof-upload" className="cursor-pointer flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {uploading ? (
                        <motion.span
                          key="uploading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Uploading...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="upload"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-5 w-5" />
                          Upload Proof Photo
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </label>
                </Button>
              </motion.div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Take a photo to prove you completed the task
              </p>
            </div>
          )}

          {/* Verification */}
          {canVerify && (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Review the proof and verify this task
              </p>
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <LoadingButton 
                    variant="outline" 
                    size="lg"
                    className="w-full h-12 min-h-[48px] border-red-300 hover:bg-red-50 hover:border-red-500 dark:border-red-800 dark:hover:bg-red-900/30"
                    onClick={() => handleVerify(false)}
                    loading={verifying}
                    loadingText="..."
                    disabled={verifying}
                  >
                    <X className="mr-2 h-5 w-5 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Reject</span>
                  </LoadingButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <LoadingButton 
                    size="lg"
                    className="w-full h-12 min-h-[48px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    onClick={() => handleVerify(true)}
                    loading={verifying}
                    loadingText="Verifying..."
                    disabled={verifying}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Approve
                  </LoadingButton>
                </motion.div>
              </div>
            </div>
          )}

          {task.status === 'done' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </motion.div>
              <p className="font-bold text-lg text-green-800 dark:text-green-200">Task Completed!</p>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-green-600 dark:text-green-400 mt-1"
              >
                +{task.difficulty} points awarded 🎉
              </motion.p>
            </motion.div>
          )}
        </div>
      </SlideInCard>
    </div>
  );
}
