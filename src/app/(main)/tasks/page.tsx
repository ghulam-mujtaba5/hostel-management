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
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Keep your hostel clean and organized</p>
          </div>
          <Button asChild className="rounded-full shadow-lg shadow-primary/20">
            <Link href="/tasks/create">
              <Plus className="mr-2 h-5 w-5" />
              New Task
            </Link>
          </Button>
        </div>

        {/* Search and Tabs */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted/50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex p-1 bg-muted/50 rounded-2xl">
            {[
              { key: 'my' as TabType, label: 'My Tasks', icon: Clock },
              { key: 'available' as TabType, label: 'Available', icon: Sparkles },
              { key: 'completed' as TabType, label: 'History', icon: CheckCircle2 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  activeTab === tab.key 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-primary' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Button
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('all')}
          className="rounded-full px-4"
        >
          All
        </Button>
        {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => (
          <Button
            key={key}
            variant={filterCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(key as TaskCategory)}
            className="rounded-full px-4 whitespace-nowrap"
          >
            <span className="mr-1.5">{emoji}</span>
            {label}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <SlideInCard direction="up">
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No matches found" : "All caught up!"}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                  {searchQuery 
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : activeTab === 'my' 
                    ? "You have no pending tasks. Pick one from the available list!" 
                    : activeTab === 'available'
                    ? "No available tasks right now. Check back later or create one."
                    : "No completed tasks in your history yet."}
                </p>
                {!searchQuery && activeTab === 'available' && (
                  <Button asChild size="lg" className="rounded-full">
                    <Link href="/tasks/create">Create Task</Link>
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
