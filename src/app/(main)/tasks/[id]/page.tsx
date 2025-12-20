"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Check, Clock, Upload, User, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, getDifficultyLabel, getDifficultyColor } from "@/types";
import { Confetti } from "@/components/Confetti";
import { formatDistanceToNow } from "date-fns";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, currentSpace } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (data) setTask(data);
    setLoading(false);
  };

  const handleTakeTask = async () => {
    if (!task || !user) return;
    
    await supabase
      .from('tasks')
      .update({ 
        assigned_to: user.id, 
        status: 'in_progress' 
      })
      .eq('id', task.id);

    await supabase.from('activity_log').insert({
      space_id: task.space_id,
      user_id: user.id,
      action: 'took_task',
      details: { task_id: task.id, title: task.title },
    });

    fetchTask();
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

      fetchTask();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (approved: boolean) => {
    if (!task || !user || !currentSpace) return;

    if (approved) {
      // Mark as done and award points
      await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', task.id);

      // Add points to the user who completed the task
      const { data: member } = await supabase
        .from('space_members')
        .select('points')
        .eq('space_id', currentSpace.id)
        .eq('user_id', task.assigned_to)
        .single();

      if (member) {
        await supabase
          .from('space_members')
          .update({ points: member.points + task.difficulty })
          .eq('space_id', currentSpace.id)
          .eq('user_id', task.assigned_to);
      }

      await supabase.from('activity_log').insert({
        space_id: task.space_id,
        user_id: user.id,
        action: 'verified_task',
        details: { task_id: task.id, title: task.title, approved: true },
      });

      setShowConfetti(true);
    } else {
      // Reject - send back to in_progress
      await supabase
        .from('tasks')
        .update({ 
          status: 'in_progress',
          proof_image_url: null
        })
        .eq('id', task.id);

      await supabase.from('activity_log').insert({
        space_id: task.space_id,
        user_id: user.id,
        action: 'rejected_proof',
        details: { task_id: task.id, title: task.title },
      });
    }

    fetchTask();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{task.title}</h1>
          <p className="text-sm text-muted-foreground">
            Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{category.emoji}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                {category.label}
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
              {getDifficultyLabel(task.difficulty)} • {task.difficulty} pts
            </span>
          </div>

          {task.description && (
            <p className="text-muted-foreground mb-4">{task.description}</p>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {task.assignee 
                  ? `Assigned to ${task.assignee.username || task.assignee.full_name}`
                  : 'Unassigned'}
              </span>
            </div>
            {task.due_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${
                task.status === 'done' ? 'bg-green-100 text-green-800' :
                task.status === 'pending_verification' ? 'bg-blue-100 text-blue-800' :
                task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status === 'pending_verification' ? 'Pending Verification' :
                 task.status === 'in_progress' ? 'In Progress' :
                 task.status === 'done' ? 'Completed' : 'To Do'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proof Image */}
      {task.proof_image_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Proof Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={task.proof_image_url} 
              alt="Task proof" 
              className="w-full rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Take Task */}
        {!task.assigned_to && task.status === 'todo' && (
          <Button className="w-full" size="lg" onClick={handleTakeTask}>
            <Check className="mr-2 h-5 w-5" />
            Take This Task
          </Button>
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
            <Button 
              className="w-full" 
              size="lg" 
              asChild
              disabled={uploading}
            >
              <label htmlFor="proof-upload" className="cursor-pointer flex items-center justify-center">
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Upload Proof Photo
                  </>
                )}
              </label>
            </Button>
          </div>
        )}

        {/* Verification */}
        {canVerify && (
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleVerify(false)}
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              Reject
            </Button>
            <Button 
              size="lg"
              onClick={() => handleVerify(true)}
            >
              <Check className="mr-2 h-5 w-5" />
              Approve
            </Button>
          </div>
        )}

        {task.status === 'done' && (
          <div className="text-center py-4 bg-green-50 rounded-lg animate-bounce-in">
            <Check className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <p className="font-medium text-green-800">Task Completed!</p>
            <p className="text-sm text-green-600">+{task.difficulty} points awarded</p>
          </div>
        )}
      </div>
    </div>
  );
}
