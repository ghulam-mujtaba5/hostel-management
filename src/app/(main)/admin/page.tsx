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
    <div className="space-y-10 pb-24">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider"
            >
              <Settings className="h-3 w-3" />
              System Administration
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Product <br />
              <span className="text-primary">Admin Portal</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Global management of all independent hostels and flats.
            </p>
          </div>

          <Button onClick={fetchStats} variant="outline" size="sm" className="rounded-xl font-bold">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={stat.href}>
              <Card className="border border-border/50 shadow-sm hover:border-primary/30 transition-all duration-300 rounded-2xl group bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors`}>
                      <stat.icon className={`h-5 w-5 text-primary`} />
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-green-500 uppercase tracking-wider">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Live
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {stat.title}
                    </p>
                    <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/50 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-bold">Platform Management</CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid gap-3">
            <Button asChild variant="outline" className="justify-between h-14 rounded-2xl border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all group">
              <Link href="/admin/hostels">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold">Manage Independent Hostels</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between h-14 rounded-2xl border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all group">
              <Link href="/admin/feedback">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold">System-wide Feedback</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-bold">System Status</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold">Database Connection</span>
                </div>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold">Authentication Service</span>
                </div>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold">Storage Service</span>
                </div>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Online</span>
              </div>
              
              <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Maintenance Notice</p>
                  <p className="text-xs text-amber-800/70 dark:text-amber-400/70 font-medium">System backup scheduled for tonight at 02:00 AM.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
