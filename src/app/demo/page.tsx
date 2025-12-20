"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle, Trophy, Sparkles, Plus, Target, Info } from "lucide-react";
import { Task, TaskCategory, Profile, Space, SpaceMember } from "@/types";
import { AuthContext } from "@/contexts/AuthContext";
import { User } from "@supabase/supabase-js";
import { TaskCard } from "@/components/TaskCard";
import { useCelebration, CelebrationOverlay } from "@/components/Celebrations";
import { StreakBadge, PointsCounter, LevelProgress, calculateLevel } from "@/components/Achievements";
import { SlideInCard, ProgressRing } from "@/components/Animations";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/Toast";

// Mock Data
const MOCK_USER = {
  id: "demo-user",
  username: "Demo User",
  full_name: "Demo User",
  points: 1250,
  streak: 5,
};

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Clean the Kitchen",
    description: "Wipe counters and sweep the floor",
    category: "kitchen",
    difficulty: 5,
    status: "todo",
    space_id: "demo-space",
    created_by: "admin",
    created_at: new Date().toISOString(),
    due_date: new Date().toISOString(),
    assigned_to: null,
    proof_image_url: null,
  },
  {
    id: "2",
    title: "Take out Trash",
    description: "Main bin is full",
    category: "trash",
    difficulty: 3,
    status: "in_progress",
    space_id: "demo-space",
    created_by: "admin",
    created_at: new Date().toISOString(),
    assigned_to: "demo-user",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    proof_image_url: null,
  }
];

const MOCK_LEADERBOARD = [
  { user_id: "demo-user", points: 1250, profile: { username: "Demo User" } },
  { user_id: "user2", points: 980, profile: { username: "Alice" } },
  { user_id: "user3", points: 850, profile: { username: "Bob" } },
];

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockUser = {
    id: MOCK_USER.id,
    email: "demo@example.com",
    app_metadata: {},
    user_metadata: { username: MOCK_USER.username },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;

  const mockProfile: Profile = {
    id: MOCK_USER.id,
    username: MOCK_USER.username,
    full_name: MOCK_USER.full_name,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSpace: Space = {
    id: "demo-space",
    name: "Demo Space",
    created_by: "admin",
    created_at: new Date().toISOString(),
    invite_code: "DEMO123",
  };

  const mockMembership: SpaceMember = {
    space_id: "demo-space",
    user_id: MOCK_USER.id,
    role: "member",
    points: MOCK_USER.points,
    joined_at: new Date().toISOString(),
  };

  const mockValue = {
    user: mockUser,
    profile: mockProfile,
    session: null,
    currentSpace: mockSpace,
    spaceMembership: mockMembership,
    userSpaces: [mockSpace],
    loading: false,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => {},
    setCurrentSpace: () => {},
    refreshProfile: async () => {},
    refreshSpaces: async () => {},
  };

  return (
    <AuthContext.Provider value={mockValue}>
      {children}
    </AuthContext.Provider>
  );
};

function DemoContent() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [showTour, setShowTour] = useState(true);
  const [tourStep, setTourStep] = useState(0);
  const { celebrate, CelebrationComponent } = useCelebration();

  const levelInfo = calculateLevel(MOCK_USER.points);

  const handleTaskAction = (taskId: string) => {
    toast.success("Action simulated in demo mode!");
    celebrate('task_completed', { points: 10 });
  };

  const tourSteps = [
    {
      title: "Welcome to HostelMate! 👋",
      description: "This is your dashboard. Here you can track your tasks, points, and progress.",
      target: "header",
    },
    {
      title: "Your Progress 📈",
      description: "Track your level and points here. Complete tasks to level up!",
      target: "level-card",
    },
    {
      title: "Weekly Goals 🎯",
      description: "Try to complete 5 tasks every week to maintain your streak.",
      target: "weekly-card",
    },
    {
      title: "Quick Actions ⚡",
      description: "Pick a new task or create one for your roommates.",
      target: "actions-card",
    },
  ];

  return (
    <div className="space-y-6 p-4 pb-20 max-w-md mx-auto">
      {CelebrationComponent}

      {/* Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  Step {tourStep + 1}/{tourSteps.length}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">{tourSteps[tourStep].title}</h3>
              <p className="text-muted-foreground mb-6">{tourSteps[tourStep].description}</p>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setShowTour(false)}>Skip Tour</Button>
                <Button onClick={() => {
                  if (tourStep < tourSteps.length - 1) {
                    setTourStep(prev => prev + 1);
                  } else {
                    setShowTour(false);
                    celebrate('first_task', { customMessage: "You're ready to go!" });
                  }
                }}>
                  {tourStep < tourSteps.length - 1 ? "Next" : "Finish"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Welcome Section */}
      <SlideInCard direction="down" delay={0}>
        <section className="space-y-2" id="header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Hey, {MOCK_USER.username}! 
                <motion.span
                  animate={{ rotate: [0, 20, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="inline-block ml-2"
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-muted-foreground">
                Demo Space • {tasks.length} pending tasks
              </p>
            </div>
            <StreakBadge streak={MOCK_USER.streak} />
          </div>
        </section>
      </SlideInCard>

      {/* Level Progress */}
      <SlideInCard direction="up" delay={0.1}>
        <Card className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-primary/20" id="level-card">
          <CardContent className="pt-4">
            <LevelProgress 
              currentPoints={levelInfo.currentLevelPoints}
              currentLevel={levelInfo.level}
              pointsForNextLevel={levelInfo.pointsForNextLevel}
            />
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2">
        <SlideInCard direction="left" delay={0.15}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length} Pending</div>
              <p className="text-xs text-muted-foreground mt-1">
                1 due today
              </p>
            </CardContent>
          </Card>
        </SlideInCard>

        <SlideInCard direction="right" delay={0.2}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">#1</span>
                <span className="text-lg">🥇</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <PointsCounter points={MOCK_USER.points} size="sm" /> points
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>

      {/* Weekly Progress */}
      <SlideInCard direction="up" delay={0.25}>
        <Card id="weekly-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ProgressRing 
                  progress={60} 
                  size={56} 
                  strokeWidth={6}
                >
                  <Target className="h-5 w-5 text-primary" />
                </ProgressRing>
                <div>
                  <p className="font-medium">Weekly Goal</p>
                  <p className="text-sm text-muted-foreground">
                    3/5 tasks completed
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      {/* Your Tasks */}
      <SlideInCard direction="up" delay={0.35}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Tasks</h2>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} onClick={() => handleTaskAction(task.id)}>
                <TaskCard 
                  task={task} 
                  onUpdate={() => {}}
                />
              </div>
            ))}
          </div>
        </section>
      </SlideInCard>

      {/* Quick Actions */}
      <SlideInCard direction="up" delay={0.45}>
        <section id="actions-card">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                className="h-20 w-full flex-col gap-2 bg-gradient-to-br from-primary/5 to-purple-600/5 hover:from-primary/10 hover:to-purple-600/10 border-primary/20" 
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Pick a Task</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span>New Task</span>
              </Button>
            </motion.div>
          </div>
        </section>
      </SlideInCard>

      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          size="sm" 
          variant="secondary" 
          className="shadow-lg"
          onClick={() => setShowTour(true)}
        >
          <Info className="mr-2 h-4 w-4" />
          Restart Tour
        </Button>
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <MockAuthProvider>
      <DemoContent />
    </MockAuthProvider>
  );
}
