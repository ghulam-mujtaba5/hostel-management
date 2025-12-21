"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, getDifficultyLabel, getDifficultyColor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingButton } from "@/components/LoadingButton";
import { Clock, User, Camera, Check, Sparkles, ChevronRight, Star, Zap, ArrowUpRight, Timer, CalendarClock } from "lucide-react";
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from "date-fns";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/Toast";
import { triggerQuickCelebration } from "@/components/Celebrations";
import { getErrorMessage } from "@/lib/errorMessages";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  showAssignee?: boolean;
  onUpdate?: () => void;
  recommended?: boolean;
  matchScore?: number;
  compact?: boolean;
}

export function TaskCard({ task, showAssignee = false, onUpdate, recommended = false, matchScore, compact = false }: TaskCardProps) {
  const { user, currentSpace } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [taking, setTaking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.other;
  const isAssignedToMe = task.assigned_to === user?.id;

  const handleTakeTask = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    setTaking(true);

    try {
      const { error } = await supabase.rpc('take_task', { task_id: task.id });
      if (error) {
        let errorCode = 'UNKNOWN_ERROR';
        if (error.message.includes('already')) {
          errorCode = 'TASK_ALREADY_TAKEN';
        } else if (error.message.includes('permission')) {
          errorCode = 'PERMISSION_DENIED';
        }
        
        const errorMsg = getErrorMessage(errorCode);
        toast.error(`${errorMsg.title}: ${errorMsg.message}`);
        return;
      }

      triggerQuickCelebration('burst');
      toast.taskTaken(task.title);
      onUpdate?.();
    } catch (err) {
      const errorMsg = getErrorMessage('NETWORK_ERROR');
      toast.error(`${errorMsg.title}: ${errorMsg.message}`);
    } finally {
      setTaking(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentSpace) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = getErrorMessage('UPLOAD_TOO_LARGE');
      toast.error(`${errorMsg.title}: ${errorMsg.message}`);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = getErrorMessage('UPLOAD_INVALID_TYPE');
      toast.error(`${errorMsg.title}: ${errorMsg.message}`);
      return;
    }

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
      const errorMsg = getErrorMessage('NETWORK_ERROR');
      toast.error(`${errorMsg.title}: ${errorMsg.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return { 
          bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
          label: 'Completed', 
          icon: '✅',
          dot: 'bg-emerald-500'
        };
      case 'pending_verification':
        return { 
          bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
          label: 'Reviewing', 
          icon: '👁️',
          dot: 'bg-blue-500 animate-pulse'
        };
      case 'in_progress':
        return { 
          bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', 
          label: 'In Progress', 
          icon: '🔄',
          dot: 'bg-amber-500'
        };
      default:
        return { 
          bg: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
          label: 'Available', 
          icon: '📋',
          dot: 'bg-slate-400'
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  
  const getDueDateInfo = () => {
    if (!task.due_date) return null;
    const date = new Date(task.due_date);
    const isOverdue = isPast(date) && task.status !== 'done';
    
    if (isToday(date)) return { text: 'Due Today', urgent: true, icon: Timer };
    if (isTomorrow(date)) return { text: 'Due Tomorrow', urgent: false, icon: CalendarClock };
    if (isOverdue) return { text: 'Overdue', urgent: true, icon: Clock };
    return { text: formatDistanceToNow(date, { addSuffix: true }), urgent: false, icon: Clock };
  };

  const dueDateInfo = getDueDateInfo();

  // Points badge colors based on difficulty
  const getPointsBadgeStyle = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (difficulty <= 6) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border-2",
        recommended 
          ? "border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 shadow-lg shadow-primary/5" 
          : "border-transparent hover:border-primary/20 shadow-sm hover:shadow-lg",
        isHovered && "shadow-xl"
      )}>
        <Link href={`/tasks/${task.id}`}>
          <CardContent className={cn("p-5", compact && "p-4")}>
            {/* Recommended Badge */}
            <AnimatePresence>
              {recommended && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-primary">Recommended</span>
                  </div>
                  {matchScore && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Star className="h-3 w-3 text-emerald-600 fill-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{matchScore}% match</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex items-start gap-4">
              {/* Category Icon */}
              <motion.div 
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300",
                  "bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50",
                  isHovered && "scale-110 shadow-lg"
                )}
                animate={isHovered ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                {category.emoji}
              </motion.div>
              
              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                    {task.description && !compact && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{task.description}</p>
                    )}
                  </div>
                  
                  {/* Points Badge */}
                  <motion.div 
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 flex-shrink-0",
                      getPointsBadgeStyle(task.difficulty)
                    )}
                    animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    +{task.difficulty} pts
                  </motion.div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center flex-wrap gap-3 text-xs mt-3">
                  {/* Status */}
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold",
                    statusConfig.bg
                  )}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
                    {statusConfig.label}
                  </div>
                  
                  {/* Due Date */}
                  {dueDateInfo && (
                    <div className={cn(
                      "flex items-center gap-1.5 text-muted-foreground font-medium",
                      dueDateInfo.urgent && "text-rose-600 dark:text-rose-400"
                    )}>
                      <dueDateInfo.icon className="h-3.5 w-3.5" />
                      <span>{dueDateInfo.text}</span>
                    </div>
                  )}
                  
                  {/* Assignee */}
                  {showAssignee && task.assignee && (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <User className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[100px]">{task.assignee.username || task.assignee.full_name}</span>
                    </div>
                  )}
                  
                  {/* Arrow indicator */}
                  <motion.div 
                    className="ml-auto"
                    animate={isHovered ? { x: 3 } : { x: 0 }}
                  >
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
                  </motion.div>
                </div>
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
              className="px-5 pb-5 pt-0"
            >
              <LoadingButton 
                size="default" 
                variant="premium"
                className="w-full gap-2 rounded-xl h-11"
                onClick={handleTakeTask}
                loading={taking}
                loadingText="Taking task..."
              >
                <Check className="h-4 w-4" />
                Take This Task
              </LoadingButton>
            </motion.div>
          )}

          {isAssignedToMe && (task.status === 'in_progress' || task.status === 'todo') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-5 pt-0"
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
              <LoadingButton
                size="default"
                variant="success"
                className="w-full gap-2 rounded-xl h-11"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                loading={uploading}
                loadingText="Uploading..."
              >
                <Camera className="h-4 w-4" />
                Upload Proof Photo
              </LoadingButton>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
