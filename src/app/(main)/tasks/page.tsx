"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Task, TASK_CATEGORIES, TaskCategory } from "@/types";
import { TaskCard } from "@/components/TaskCard";

type TabType = 'my' | 'available' | 'completed';

export default function TasksPage() {
  const { user, currentSpace } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');

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

  const filteredTasks = filterCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === filterCategory);

  if (!currentSpace) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select a space first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button asChild>
          <Link href="/tasks/create">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'my' as TabType, label: 'My Tasks' },
          { key: 'available' as TabType, label: 'Available' },
          { key: 'completed' as TabType, label: 'Completed' },
        ].map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filterCategory === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilterCategory('all')}
        >
          All
        </Button>
        {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => (
          <Button
            key={key}
            variant={filterCategory === key ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterCategory(key as TaskCategory)}
          >
            {emoji} {label}
          </Button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {activeTab === 'my' 
                ? "You have no pending tasks. Pick one from available!" 
                : activeTab === 'available'
                ? "No available tasks. Create one or wait for new tasks."
                : "No completed tasks yet."}
            </p>
            {activeTab === 'available' && (
              <Button asChild className="mt-4">
                <Link href="/tasks/create">Create Task</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task}
              showAssignee={activeTab !== 'my'}
              onUpdate={fetchTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
