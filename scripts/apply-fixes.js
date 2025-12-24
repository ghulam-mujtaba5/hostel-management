const fs = require('fs');
const path = require('path');

const files = {
  'src/app/(main)/history/page.tsx': `'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
  History, CheckCircle2, User, Calendar, Activity, 
  Trophy, TrendingUp, Filter
} from 'lucide-react';
import { Task, Profile, SpaceMember, ActivityLog } from '@/types';
import { getDifficultyColor, getDifficultyLabel } from '@/types';

type HistoryItem = {
  id: string;
  type: 'task' | 'log';
  date: string;
  user: Profile | null;
  title: string;
  details?: string;
  meta?: any;
};

export default function HistoryPage() {
  const { currentSpace } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [members, setMembers] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentSpace) {
      fetchHistoryData();
    }
  }, [currentSpace]);

  async function fetchHistoryData() {
    if (!currentSpace) return;
    setLoading(true);

    try {
      // 1. Fetch Members
      const { data: membersData } = await supabase
        .from('space_members')
        .select('*, profile:profiles(*)')
        .eq('space_id', currentSpace.id);
      
      if (membersData) {
        setMembers(membersData as any);
      }

      // 2. Fetch Completed Tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, assignee:profiles!assigned_to(*)')
        .eq('space_id', currentSpace.id)
        .eq('status', 'done')
        .order('updated_at', { ascending: false })
        .limit(50);

      // 3. Fetch Activity Logs
      const { data: logsData } = await supabase
        .from('activity_log')
        .select('*, profile:profiles(*)')
        .eq('space_id', currentSpace.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Combine and sort
      const items: HistoryItem[] = [];

      tasksData?.forEach((task: any) => {
        items.push({
          id: task.id,
          type: 'task',
          date: task.updated_at,
          user: task.assignee,
          title: `Completed task: ${task.title}`,
          details: \`Earned \${task.difficulty} points\`,
          meta: task
        });
      });

      logsData?.forEach((log: any) => {
        items.push({
          id: log.id,
          type: 'log',
          date: log.created_at,
          user: log.profile,
          title: log.action,
          details: JSON.stringify(log.details),
          meta: log
        });
      });

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistoryItems(items);

    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History & Insights</h1>
          <p className="text-muted-foreground">
            Track performance and activity in {currentSpace?.name}
          </p>
        </div>
      </div>

      <div className="w-full">
        <div className="grid w-full grid-cols-3 bg-muted p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('timeline')}
            className={\`py-1.5 text-sm font-medium rounded-md transition-all \${
              activeTab === 'timeline' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:bg-background/50'
            }\`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={\`py-1.5 text-sm font-medium rounded-md transition-all \${
              activeTab === 'performance' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:bg-background/50'
            }\`}
          >
            Member Performance
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={\`py-1.5 text-sm font-medium rounded-md transition-all \${
              activeTab === 'tasks' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:bg-background/50'
            }\`}
          >
            Task History
          </button>
        </div>

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {historyItems.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {item.type === 'task' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <History className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="relative flex h-6 w-6 shrink-0 overflow-hidden rounded-full">
                            {item.user?.avatar_url ? (
                              <img className="aspect-square h-full w-full" src={item.user.avatar_url} alt={item.user.username || ''} />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-[10px]">
                                {item.user?.username?.[0] || '?'}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-sm">{item.user?.username || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(item.date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.details && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {item.details.replace(/[{}"\\\\]/g, ' ').trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {historyItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {members
                .sort((a, b) => b.points - a.points)
                .map((member, index) => (
                <Card key={member.user_id} className={index === 0 ? 'border-yellow-200 bg-yellow-50/30' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-sm">
                            {member.profile?.avatar_url ? (
                              <img className="aspect-square h-full w-full" src={member.profile.avatar_url} alt={member.profile.username || ''} />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-lg">
                                {member.profile?.username?.[0] || '?'}
                              </div>
                            )}
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1 shadow-sm">
                              <Trophy className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {member.profile?.username}
                            {member.role === 'admin' && (
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                                Admin
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Joined {format(new Date(member.joined_at), 'MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{member.points}</div>
                        <div className="text-xs text-muted-foreground">Total Points</div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Contribution Level</span>
                          <span className="font-medium">
                            {member.points > 100 ? 'Expert' : member.points > 50 ? 'Regular' : 'Novice'}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all" 
                            style={{ width: \`\${Math.min(100, (member.points / 200) * 100)}%\` }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <div className="text-xs text-muted-foreground">Role</div>
                          <div className="font-medium capitalize">{member.role}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <div className="text-xs text-muted-foreground">Status</div>
                          <div className="font-medium capitalize text-green-600">Active</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks History</CardTitle>
                <CardDescription>
                  Archive of all completed tasks in this space
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historyItems
                    .filter(i => i.type === 'task')
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={\`p-2 rounded-full \${getDifficultyColor(item.meta.difficulty)} bg-opacity-20\`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{item.meta.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <span className="capitalize">{item.meta.category}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.user?.username}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            +{item.meta.difficulty} pts
                          </span>
                        </div>
                      </div>
                    ))}
                    
                  {historyItems.filter(i => i.type === 'task').length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No completed tasks yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
`,
  'src/components/Navbar.tsx': `"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy, Moon, Sun, Sparkles, Menu, X, LogOut, ChevronDown, Building, History } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, profile, currentSpace, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          scrolled ? "bg-background/80 backdrop-blur-md border-border" : "bg-transparent border-transparent py-2"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo & Space Name */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            {user && currentSpace && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium">
                <Building className="h-3 w-3 text-muted-foreground" />
                {currentSpace.name}
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Button
                  key={link.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className={cn("gap-2", isActive && "font-semibold")}
                >
                  <Link href={link.href}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 pl-2 pr-3 rounded-full border border-border/50 hover:bg-muted/50"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {(profile?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-popover border shadow-lg overflow-hidden p-1"
                    >
                      <div className="px-3 py-2 border-b mb-1">
                        <p className="text-sm font-medium truncate">{profile?.full_name || profile?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setProfileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 font-normal">
                          <User className="h-4 w-4" /> Profile
                        </Button>
                      </Link>
                      <Link href="/spaces" onClick={() => setProfileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 font-normal">
                          <Building className="h-4 w-4" /> My Spaces
                        </Button>
                      </Link>
                      <div className="h-px bg-border my-1" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start gap-2 font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button asChild size="sm" className="rounded-full px-6">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t pb-safe">
        <div className="flex items-center justify-around p-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px]",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          <Link 
            href="/profile"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px]",
              pathname === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className={cn("h-5 w-5", pathname === "/profile" && "fill-current")} />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
`,
  'src/components/SmartAssistant.tsx': \`'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSpaceInsights, IntelligenceInsight } from '@/lib/intelligence';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function SmartAssistant() {
  const { currentSpace, user } = useAuth();
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentSpace && user) {
      loadInsights();
    }
  }, [currentSpace, user]);

  async function loadInsights() {
    if (!currentSpace || !user) return;
    try {
      setLoading(true);
      const data = await getSpaceInsights(supabase, currentSpace.id, user.id);
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(insight: IntelligenceInsight, action: 'accept' | 'reject' | 'snooze') {
    if (!insight.id) return; // Can't update if not saved yet (should be saved by getSpaceInsights)

    try {
      const status = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'snoozed';
      
      const { error } = await supabase
        .from('task_suggestions')
        .update({ status })
        .eq('id', insight.id);

      if (error) throw error;

      // Remove from UI
      setInsights(prev => prev.filter(i => i.id !== insight.id));

      if (action === 'accept') {
        if (insight.action === 'create_task') {
          // Redirect to create task or open modal (simplified here)
          toast.success('Suggestion accepted! Go to Tasks to create it.');
        } else if (insight.action === 'remind_user') {
          // Send notification (simplified)
          toast.success('Reminder sent to member!');
        }
      } else if (action === 'snooze') {
        toast.info('Snoozed for later.');
      }
    } catch (error) {
      toast.error('Failed to update suggestion');
    }
  }

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>;
  if (insights.length === 0) return null;

  return (
    <Card className="border-indigo-100 bg-indigo-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Smart Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={insight.id || idx} className="bg-white p-3 rounded-md shadow-sm border border-indigo-100 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              {insight.type === 'prediction' ? (
                <Clock className="w-5 h-5 text-blue-500 mt-1" />
              ) : (
                <Bell className="w-5 h-5 text-orange-500 mt-1" />
              )}
              <div>
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 h-8"
                onClick={() => handleAction(insight, 'reject')}
              >
                No need
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 hover:text-indigo-700 h-8"
                onClick={() => handleAction(insight, 'snooze')}
              >
                Wait more
              </Button>
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 h-8"
                onClick={() => handleAction(insight, 'accept')}
              >
                {insight.action === 'create_task' ? 'Create Task' : 'Send Reminder'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
\`,
  'src/components/ui/switch.tsx': \`"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input">
    <input
      type="checkbox"
      className={cn(
        "peer absolute h-full w-full cursor-pointer opacity-0",
        className
      )}
      ref={ref}
      {...props}
    />
    <div className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform peer-checked:translate-x-5 peer-checked:bg-background" />
  </div>
))
Switch.displayName = "Switch"

export { Switch }
\`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), filePath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(\`Fixed \${filePath}\`);
}
