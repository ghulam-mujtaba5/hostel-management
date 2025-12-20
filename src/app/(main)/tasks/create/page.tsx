"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TASK_CATEGORIES, TaskCategory } from "@/types";

export default function CreateTaskPage() {
  const { user, currentSpace } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [difficulty, setDifficulty] = useState(5);
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace || !user) return;
    
    setLoading(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from('tasks').insert({
        space_id: currentSpace.id,
        title,
        description: description || null,
        category,
        difficulty,
        due_date: dueDate || null,
        created_by: user.id,
        status: 'todo',
      });

      if (insertError) throw insertError;

      // Log activity
      await supabase.from('activity_log').insert({
        space_id: currentSpace.id,
        user_id: user.id,
        action: 'created_task',
        details: { title, category, difficulty },
      });

      router.push('/tasks');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!currentSpace) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select a space first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Task</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Clean the kitchen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add any details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key as TaskCategory)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      category === key 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <p className="text-xs mt-1">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Difficulty: {difficulty} points
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Easy (1-3)</span>
                <span>Medium (4-6)</span>
                <span>Hard (7-10)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date (optional)</label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
