"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, getDifficultyLabel, getDifficultyColor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Camera, Check, Sparkles, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/Toast";
import { triggerQuickCelebration } from "@/components/Celebrations";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  showAssignee?: boolean;
  onUpdate?: () => void;
  recommended?: boolean;
  matchScore?: number;
}

export function TaskCard({ task, showAssignee = false, onUpdate, recommended = false, matchScore }: TaskCardProps) {
  const { user, currentSpace } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [taking, setTaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.other;
  const isAssignedToMe = task.assigned_to === user?.id;

  const handleTakeTask = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    setTaking(true);

    const { error } = await supabase.rpc('take_task', { task_id: task.id });
    if (error) {
      toast.error(error.message);
      setTaking(false);
      return;
    }

    triggerQuickCelebration('burst');
    toast.taskTaken(task.title);
    setTaking(false);
    onUpdate?.();
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentSpace) return;

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

      toast.success('Proof uploaded!', { emoji: '📸', subtitle: 'Waiting for verification' });
      onUpdate?.();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return { bg: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', label: 'Done', icon: '✅' };
      case 'pending_verification':
        return { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', label: 'Pending', icon: '👁️' };
      case 'in_progress':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', label: 'In Progress', icon: '🔄' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300', label: 'To Do', icon: '📋' };
    }
  };

  const statusConfig = getStatusConfig(task.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20",
        recommended && "ring-1 ring-primary/30 bg-primary/5"
      )}>
        <Link href={`/tasks/${task.id}`}>
          <CardContent className="p-5">
            {/* Recommended Badge */}
            {recommended && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary mb-3"
              >
                <Sparkles className="h-3 w-3" />
                <span>Recommended for you</span>
                {matchScore && (
                  <span className="ml-auto bg-primary/10 px-2 py-0.5 rounded-full">
                    {matchScore}% match
                  </span>
                )}
              </motion.div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-xl flex-shrink-0">
                  {category.emoji}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base line-clamp-1">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
                  )}
                </div>
              </div>
              <div className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ml-3",
                getDifficultyColor(task.difficulty)
              )}>
                +{task.difficulty} pts
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-muted-foreground font-medium">
                {task.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                  </div>
                )}
                {showAssignee && task.assignee && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[80px]">{task.assignee.username || task.assignee.full_name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  statusConfig.bg
                )}>
                  {statusConfig.label}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              </div>
            </div>
          </CardContent>
        </Link>

        {/* Quick Actions */}
        <AnimatePresence mode="wait">
          {!task.assigned_to && task.status === 'todo' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-5"
            >
              <Button 
                size="sm" 
                className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                onClick={handleTakeTask}
                disabled={taking}
              >
                {taking ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Taking...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Take This Task
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {isAssignedToMe && (task.status === 'in_progress' || task.status === 'todo') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleUploadProof}
                className="hidden"
                disabled={uploading}
              />
              <Button 
                size="sm" 
                variant="secondary"
                className="w-full gap-2 border border-border/50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Upload Proof Photo
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
