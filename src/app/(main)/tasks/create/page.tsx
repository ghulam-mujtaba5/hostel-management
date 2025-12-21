"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, FileText, Tag, Check, AlertCircle, Sparkles, Gauge } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TASK_CATEGORIES, TaskCategory } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/Toast";
import { LoadingButton } from "@/components/LoadingButton";
import { SlideInCard } from "@/components/Animations";

const DIFFICULTY_LABELS = [
  { range: [1, 3], label: "Easy", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  { range: [4, 6], label: "Medium", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  { range: [7, 10], label: "Hard", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
];

const getDifficultyInfo = (difficulty: number) => {
  return DIFFICULTY_LABELS.find(d => difficulty >= d.range[0] && difficulty <= d.range[1]) || DIFFICULTY_LABELS[1];
};

export default function CreateTaskPage() {
  const { user, currentSpace } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [difficulty, setDifficulty] = useState(5);
  const [dueDate, setDueDate] = useState("");

  const difficultyInfo = getDifficultyInfo(difficulty);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace || !user) return;
    
    if (!validateForm()) {
      toast.error('Please fix the errors above');
      return;
    }

    setLoading(true);

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

      await supabase.from('activity_log').insert({
        space_id: currentSpace.id,
        user_id: user.id,
        action: 'created_task',
        details: { title, category, difficulty },
      });

      toast.success('Task created!', { emoji: '✨', subtitle: 'Task added to the list' });
      setTimeout(() => router.push('/tasks'), 500);
    } catch (err: unknown) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!currentSpace) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select a space first</p>
        <Button asChild className="mt-4">
          <Link href="/spaces">Go to Spaces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SlideInCard direction="down" delay={0}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tasks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Create Task
            </h1>
            <p className="text-sm text-muted-foreground">Add a new task for your space</p>
          </div>
        </div>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.1}>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Title
                </label>
                <Input
                  placeholder="e.g., Clean the kitchen"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </motion.div>

              {/* Description */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Description (optional)
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Add any details about this task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </motion.div>

              {/* Category */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => {
                    const isSelected = category === key;
                    return (
                      <motion.button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key as TaskCategory)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl border-2 text-center transition-all relative overflow-hidden ${
                          isSelected 
                            ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md' 
                            : 'border-border hover:bg-muted/50 hover:border-primary/50'
                        }`}
                      >
                        <motion.span 
                          className="text-2xl block"
                          animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {emoji}
                        </motion.span>
                        <p className="text-xs mt-1 font-medium">{label}</p>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute top-1 right-1"
                            >
                              <Check className="h-4 w-4 text-primary" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Difficulty */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" />
                  Difficulty
                </label>
                <div className={`p-4 rounded-xl ${difficultyInfo.bg} transition-colors`}>
                  <div className="flex items-center justify-between mb-3">
                    <motion.span 
                      key={difficulty}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className={`text-2xl font-bold ${difficultyInfo.color}`}
                    >
                      {difficulty} pts
                    </motion.span>
                    <span className={`text-sm font-medium ${difficultyInfo.color}`}>
                      {difficultyInfo.label}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full h-2 bg-white/50 dark:bg-black/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Easy (1-3)</span>
                    <span>Medium (4-6)</span>
                    <span>Hard (7-10)</span>
                  </div>
                </div>
              </motion.div>

              {/* Due Date */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Due Date (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-12"
                />
              </motion.div>

              <AnimatePresence>
                {errors.title && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                  >
                    {errors.title}
                  </motion.p>
                )}
                {errors.description && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                  >
                    {errors.description}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-base font-medium" 
                  disabled={loading || !title.trim()}
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Creating...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="create"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Create Task
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </SlideInCard>
    </div>
  );
}
