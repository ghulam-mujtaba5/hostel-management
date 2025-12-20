'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Home, 
  MessageSquare, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSpaces: 0,
    pendingFeedback: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        { count: studentsCount },
        { count: spacesCount },
        { count: feedbackCount },
        { count: tasksCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('spaces').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done')
      ]);

      setStats({
        totalStudents: studentsCount || 0,
        totalSpaces: spacesCount || 0,
        pendingFeedback: feedbackCount || 0,
        completedTasks: tasksCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Active Hostels', 
      value: stats.totalSpaces, 
      icon: Home, 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      href: '/admin/hostels'
    },
    { 
      title: 'Total Users', 
      value: stats.totalStudents, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      href: '/admin/hostels'
    },
    { 
      title: 'Pending Feedback', 
      value: stats.pendingFeedback, 
      icon: MessageSquare, 
      color: 'text-amber-600', 
      bg: 'bg-amber-100',
      href: '/admin/feedback'
    },
    { 
      title: 'System Tasks', 
      value: stats.completedTasks, 
      icon: CheckCircle, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      href: '/admin/hostels'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Admin Portal</h1>
          <p className="text-muted-foreground">Global management of all independent hostels and flats.</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bg} p-2 rounded-lg`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span>Updated just now</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Management</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild variant="outline" className="justify-between h-12">
              <Link href="/admin/hostels">
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-primary" />
                  <span>Manage Independent Hostels</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between h-12">
              <Link href="/admin/feedback">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>System-wide Feedback</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Database Connection: Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Authentication Service: Online</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Storage Service: Online</span>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-bold">Maintenance Notice</p>
                  <p>System backup scheduled for tonight at 02:00 AM.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
