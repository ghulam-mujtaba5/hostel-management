"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, CheckCircle, Calendar, ListTodo, Clock, CheckCircle2, Search, Sparkles, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, TaskCategory } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { TaskCardSkeleton } from "@/components/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";

type TabType = 'my' | 'available' | 'completed';

export default function TasksPage() {
  const { user, currentSpace, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentSpace) {
      fetchTasks();
    }
  }, [currentSpace, activeTab]);

  const fetchTasks = async () => {
    if (!currentSpace || !user) return;
    
    setLoading(true);
    
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*)
      `)
      .eq('space_id', currentSpace.id);

    if (activeTab === 'my') {
      query = query.eq('assigned_to', user.id).in('status', ['todo', 'in_progress', 'pending_verification']);
    } else if (activeTab === 'available') {
      query = query.is('assigned_to', null).eq('status', 'todo');
    } else {
      query = query.eq('status', 'done');
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (data) setTasks(data);
    setLoading(false);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="space-y-6">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 max-w-md"
        >
          <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto">
            <ListTodo className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Sign In Required</h2>
            <p className="text-muted-foreground font-medium">
              Please sign in to view and manage tasks with your flatmates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="rounded-xl px-8 font-bold gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl px-8 font-bold gap-2">
              <Link href="/login?mode=signup">
                <UserPlus className="h-4 w-4" />
                Create Account
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No Space Selected"
        description="Please select or join a hostel space to view and manage tasks."
        action={{
          label: 'Select Space',
          href: '/spaces'
        }}
        secondaryAction={{
          label: 'Create New Space',
          href: '/spaces/create'
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    const getEmptyStateConfig = () => {
      if (activeTab === 'completed') {
        return {
          title: 'No Completed Tasks',
          description: 'Great work! Once you complete tasks, they\'ll appear here.',
          action: { label: 'View Available Tasks', onClick: () => setActiveTab('available') }
        };
      }
      if (activeTab === 'available') {
        return {
          title: 'All Tasks Assigned!',
          description: 'All available tasks have been taken. Create new ones or check back later!',
          action: { label: 'Create Task', href: '/tasks/create' }
        };
      }
      return {
        title: 'No Active Tasks',
        description: 'No tasks assigned to you yet. Start by taking an available task!',
        action: { label: 'Browse Available', onClick: () => setActiveTab('available') }
      };
    };

    const config = getEmptyStateConfig();
    return (
      <EmptyState
        icon={CheckCircle2}
        title={config.title}
        description={config.description}
        action={config.action}
      />
    );
  }

  return (
    <div className="space-y-10 pb-24">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider"
            >
              <ListTodo className="h-3 w-3" />
              Task Management
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Hostel <br />
              <span className="text-primary">Operations</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Keep your shared space clean and organized with ease.
            </p>
          </div>

          <Button asChild size="lg" className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all group">
            <Link href="/tasks/create">
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              Create Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-border/50 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base font-medium outline-none"
            />
          </div>

          <div className="flex p-1 bg-muted/30 border border-border/50 rounded-xl">
            {[
              { key: 'my' as TabType, label: 'My Tasks', icon: Clock },
              { key: 'available' as TabType, label: 'Available', icon: Sparkles },
              { key: 'completed' as TabType, label: 'History', icon: CheckCircle2 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === tab.key 
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
              className={`rounded-lg px-4 font-bold h-9 ${filterCategory === 'all' ? 'shadow-md shadow-primary/20' : 'border-border/50 bg-white dark:bg-slate-900'}`}
            >
              All
            </Button>
            {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => (
              <Button
                key={key}
                variant={filterCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(key as TaskCategory)}
                className={`rounded-lg px-4 font-bold h-9 whitespace-nowrap ${filterCategory === key ? 'shadow-md shadow-primary/20' : 'border-border/50 bg-white dark:bg-slate-900'}`}
              >
                <span className="mr-2">{emoji}</span>
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : filteredTasks.length === 0 ? (
          <SlideInCard direction="up">
            <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardContent className="py-20 text-center">
                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">
                  {searchQuery ? "No matches found" : "All caught up!"}
                </h3>
                <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto font-medium">
                  {searchQuery 
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : activeTab === 'my' 
                    ? "You have no pending tasks. Why not pick one from the available list?" 
                    : activeTab === 'available'
                    ? "No available tasks right now. You've done a great job keeping things clean!"
                    : "No completed tasks in your history yet."}
                </p>
                {!searchQuery && activeTab === 'available' && (
                  <Button asChild size="lg" className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary">
                    <Link href="/tasks/create">Create New Task</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </SlideInCard>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskCard 
                    task={task}
                    showAssignee={activeTab !== 'my'}
                    onUpdate={fetchTasks}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
