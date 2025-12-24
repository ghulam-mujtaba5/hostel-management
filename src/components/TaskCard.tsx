"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Camera, Check, Sparkles, ArrowUpRight, Timer, CalendarClock } from "lucide-react";
import { formatDistanceToNow, isToday, isTomorrow, isPast } from "date-fns";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.other;
  const isAssignedToMe = task.assigned_to === user?.id;

  const handleTakeTask = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    setTaking(true);

    try {
      const { error } = await supabase.rpc("take_task", { task_id: task.id });
      if (error) throw error;

      toast.success(`You took: ${task.title}`);
      onUpdate?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTaking(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentSpace) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${task.id}-${Date.now()}.${fileExt}`;
      const filePath = `${task.space_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("proofs")
        .getPublicUrl(filePath);

      const { error } = await supabase.rpc("submit_task_proof", {
        task_id: task.id,
        proof_image_url: publicUrl,
      });

      if (error) throw error;

      toast.success("Proof uploaded!");
      onUpdate?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getDueDateInfo = () => {
    if (!task.due_date) return null;
    const date = new Date(task.due_date);
    const isOverdue = isPast(date) && task.status !== "done";
    
    if (isToday(date)) return { text: "Today", urgent: true, icon: Timer };
    if (isTomorrow(date)) return { text: "Tomorrow", urgent: false, icon: CalendarClock };
    if (isOverdue) return { text: "Overdue", urgent: true, icon: Clock };
    return { text: formatDistanceToNow(date, { addSuffix: true }), urgent: false, icon: Clock };
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "group overflow-hidden transition-all hover:shadow-md border-border/60",
        recommended && "border-primary/30 bg-primary/5"
      )}>
        <Link href={`/tasks/${task.id}`}>
          <CardContent className={cn("p-5", compact && "p-4")}>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                {category.emoji}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base truncate pr-2 group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                    {recommended && (
                      <div className="flex items-center gap-1 text-xs text-primary font-medium mt-0.5">
                        <Sparkles className="h-3 w-3" />
                        Recommended
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                    +{task.difficulty} pts
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-3 text-xs mt-3 text-muted-foreground">
                  {dueDateInfo && (
                    <div className={cn(
                      "flex items-center gap-1 font-medium",
                      dueDateInfo.urgent && "text-destructive"
                    )}>
                      <dueDateInfo.icon className="h-3.5 w-3.5" />
                      <span>{dueDateInfo.text}</span>
                    </div>
                  )}
                  
                  {showAssignee && task.assignee && (
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[100px]">
                        {task.assignee.username || task.assignee.full_name}
                      </span>
                    </div>
                  )}

                  {task.creator && (
                    <div className="flex items-center gap-1" title={`Created by ${task.creator.full_name || task.creator.username}`}>
                      <span className="text-muted-foreground/70">By</span>
                      <span className="truncate max-w-[100px]">
                        {task.creator.username || task.creator.full_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Link>

        {/* Quick Actions */}
        <AnimatePresence>
          {(!task.assigned_to && task.status === "todo") && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-0">
                <Button 
                  className="w-full h-9 text-xs"
                  onClick={handleTakeTask}
                  disabled={taking}
                >
                  {taking ? "Taking..." : "Take Task"}
                </Button>
              </div>
            </motion.div>
          )}

          {isAssignedToMe && (task.status === "in_progress" || task.status === "todo") && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-0">
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
                  variant="secondary"
                  className="w-full h-9 text-xs gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Upload Proof"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
