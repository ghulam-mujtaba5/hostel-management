"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, getDifficultyLabel, getDifficultyColor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Camera, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface TaskCardProps {
  task: Task;
  showAssignee?: boolean;
  onUpdate?: () => void;
}

export function TaskCard({ task, showAssignee = false, onUpdate }: TaskCardProps) {
  const { user, currentSpace } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.other;
  const isAssignedToMe = task.assigned_to === user?.id;

  const handleTakeTask = async () => {
    if (!user) return;
    
    await supabase
      .from('tasks')
      .update({ 
        assigned_to: user.id, 
        status: 'in_progress' 
      })
      .eq('id', task.id);

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

      await supabase
        .from('tasks')
        .update({ 
          proof_image_url: publicUrl,
          status: 'pending_verification'
        })
        .eq('id', task.id);

      await supabase.from('activity_log').insert({
        space_id: task.space_id,
        user_id: user.id,
        action: 'uploaded_proof',
        details: { task_id: task.id, title: task.title },
      });

      onUpdate?.();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <Link href={`/tasks/${task.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{category.emoji}</span>
              <div>
                <h3 className="font-medium line-clamp-1">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                )}
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
              +{task.difficulty}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                </div>
              )}
              {showAssignee && task.assignee && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{task.assignee.username || task.assignee.full_name}</span>
                </div>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded text-xs ${
              task.status === 'done' ? 'bg-green-100 text-green-800' :
              task.status === 'pending_verification' ? 'bg-blue-100 text-blue-800' :
              task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.status === 'pending_verification' ? 'Pending' :
               task.status === 'in_progress' ? 'In Progress' :
               task.status === 'done' ? 'Done' : 'To Do'}
            </span>
          </div>
        </CardContent>
      </Link>

      {/* Quick Actions */}
      {!task.assigned_to && task.status === 'todo' && (
        <div className="px-4 pb-4">
          <Button 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              handleTakeTask();
            }}
          >
            <Check className="mr-2 h-4 w-4" />
            Take Task
          </Button>
        </div>
      )}

      {isAssignedToMe && (task.status === 'in_progress' || task.status === 'todo') && (
        <div className="px-4 pb-4">
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
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
          >
            <Camera className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Proof'}
          </Button>
        </div>
      )}
    </Card>
  );
}
