"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, CheckCircle, Calendar, ListTodo, Clock, CheckCircle2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, TaskCategory } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";

type TabType = 'my' | 'available' | 'completed';

export default function TasksPage() {
  const { user, currentSpace } = useAuth();
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

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <ListTodo className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Space Selected</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">Please select or join a hostel space to view and manage tasks.</p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/spaces">Select Space</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider"
            >
              <ListTodo className="h-3 w-3" />
              Task Management
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Hostel <br />
              <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Operations
              </span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Keep your shared space clean and organized (Amanah).
            </p>
          </div>

          <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all group">
            <Link href="/tasks/create">
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              Create Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card/50 backdrop-blur-sm border-0 rounded-[1.5rem] shadow-sm focus:ring-2 focus:ring-primary transition-all text-lg font-medium"
            />
          </div>

          <div className="flex p-1.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-[1.5rem] shadow-sm">
            {[
              { key: 'my' as TabType, label: 'My Tasks', icon: Clock },
              { key: 'available' as TabType, label: 'Available', icon: Sparkles },
              { key: 'completed' as TabType, label: 'History', icon: CheckCircle2 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-2xl transition-all ${
                  activeTab === tab.key 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
              className={`rounded-xl px-4 font-bold ${filterCategory === 'all' ? 'shadow-lg shadow-primary/20' : 'border-primary/10 bg-card/50'}`}
            >
              All
            </Button>
            {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => (
              <Button
                key={key}
                variant={filterCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(key as TaskCategory)}
                className={`rounded-xl px-4 font-bold whitespace-nowrap ${filterCategory === key ? 'shadow-lg shadow-primary/20' : 'border-primary/10 bg-card/50'}`}
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
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <ListTodo className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary/40" />
            </div>
            <p className="text-lg font-bold text-muted-foreground animate-pulse">Syncing tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <SlideInCard direction="up">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
              <CardContent className="py-24 text-center">
                <div className="h-24 w-24 rounded-[2rem] bg-muted flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-4">
                  {searchQuery ? "No matches found" : "All caught up!"}
                </h3>
                <p className="text-xl text-muted-foreground mb-10 max-w-md mx-auto font-medium">
                  {searchQuery 
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : activeTab === 'my' 
                    ? "You have no pending tasks. Why not pick one from the available list?" 
                    : activeTab === 'available'
                    ? "No available tasks right now. You've done a great job keeping things clean!"
                    : "No completed tasks in your history yet."}
                </p>
                {!searchQuery && activeTab === 'available' && (
                  <Button asChild size="lg" className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-purple-600">
                    <Link href="/tasks/create">Create New Task</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </SlideInCard>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
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
