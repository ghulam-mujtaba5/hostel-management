"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AnimatedDiv, 
  AnimatedList, 
  SlideInCard, 
  Float, 
  Pulse, 
  fadeIn, 
  slideUp 
} from "@/components/Animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  Users, 
  CheckSquare, 
  Trophy, 
  Scale, 
  MessageSquare, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Shield,
  Zap,
  Sparkles
} from "lucide-react";
import Link from "next/link";

const guideSteps = [
  {
    id: "intro",
    title: "Welcome to Hostel Management",
    description: "Your all-in-one solution for managing hostel life, tasks, and fairness.",
    icon: <Home className="w-12 h-12 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>
          Living together is a trust (Amanah). It becomes easier when everyone fulfills their duties. This system helps you manage tasks, uphold fairness, and keep your space pure and organized.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-2">
              <Users className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">Collaborate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Join a space with your flatmates and manage everything with mutual respect.</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-2">
              <CheckSquare className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">Track Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Cleanliness is half of faith. Create, assign, and complete tasks to keep the hostel pristine.</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-2">
              <Scale className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle className="text-lg">Uphold Justice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Our AI-powered fairness system ensures everyone contributes equitably.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: "spaces",
    title: "Spaces & Flatmates",
    description: "Create your digital home and invite your flatmates to build a supportive community.",
    icon: <Users className="w-12 h-12 text-blue-500" />,
    content: (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Create or Join
            </h3>
            <p className="text-muted-foreground">
              Start by creating a new Space for your hostel or join an existing one using an invite code.
            </p>
            
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Invite Members
            </h3>
            <p className="text-muted-foreground">
              Share your unique space code with flatmates so they can join instantly.
            </p>
          </div>
          <div className="flex-1">
            <Float>
              <Card className="w-full max-w-sm mx-auto overflow-hidden shadow-lg border-blue-200 dark:border-blue-900">
                <div className="bg-blue-500 h-2 w-full" />
                <CardHeader>
                  <CardTitle>Room 302</CardTitle>
                  <CardDescription>4 Members • Created 2 days ago</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2 overflow-hidden mb-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        U{i}
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
                    <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                    <p className="text-lg font-mono font-bold tracking-widest">XJ9-22K</p>
                  </div>
                </CardContent>
              </Card>
            </Float>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "tasks",
    title: "Task Management",
    description: "Maintain cleanliness and order without the arguments.",
    icon: <CheckSquare className="w-12 h-12 text-green-500" />,
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="order-2 md:order-1">
            <AnimatedList className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border shadow-sm">
                <div className="h-5 w-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium line-through text-muted-foreground">Clean Kitchen</p>
                  <p className="text-xs text-muted-foreground">Completed by Alex • 20 pts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border shadow-sm">
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
                <div className="flex-1">
                  <p className="font-medium">Take out Trash</p>
                  <p className="text-xs text-muted-foreground">Due Today • 10 pts</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">Pick</Button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border shadow-sm">
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
                <div className="flex-1">
                  <p className="font-medium">Vacuum Hallway</p>
                  <p className="text-xs text-muted-foreground">Due Tomorrow • 15 pts</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">Pick</Button>
              </div>
            </AnimatedList>
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <h3 className="text-xl font-semibold">Smart Task Assignment</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                <span className="text-muted-foreground">Create tasks with point values based on difficulty.</span>
              </li>
              <li className="flex gap-3">
                <Users className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-muted-foreground">Assign to specific people or leave open for anyone to pick.</span>
              </li>
              <li className="flex gap-3">
                <CheckSquare className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-muted-foreground">Mark as complete to earn points and improve your fairness score.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "fairness",
    title: "Fairness Score",
    description: "Our unique algorithm ensures justice and that everyone contributes their fair share.",
    icon: <Scale className="w-12 h-12 text-purple-500" />,
    content: (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <Pulse>
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="12"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
                <circle
                  className="text-purple-500 stroke-current"
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                  strokeDasharray="440"
                  strokeDashoffset="110" // 75%
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-purple-500">7.5</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Fairness</span>
              </div>
            </div>
          </Pulse>
          
          <h3 className="text-2xl font-bold mb-2">How it works</h3>
          <p className="text-muted-foreground mb-6">
            The Fairness Score (0-10) reflects your contribution to the collective well-being. 
            A score of 5.0 is perfectly average. Higher means you're doing more than your share!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50">
              <p className="font-bold text-red-600 dark:text-red-400 mb-1">0 - 3.0</p>
              <p className="text-xs text-muted-foreground">Needs improvement. You're doing significantly less than others.</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50">
              <p className="font-bold text-yellow-600 dark:text-yellow-400 mb-1">3.1 - 6.0</p>
              <p className="text-xs text-muted-foreground">Good zone. You're contributing a fair share to the household.</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50">
              <p className="font-bold text-green-600 dark:text-green-400 mb-1">6.1 - 10</p>
              <p className="text-xs text-muted-foreground">Superstar! You're carrying the team. Maybe take a break?</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "leaderboard",
    title: "Leaderboard & Rewards",
    description: "Compete in good deeds and strive for the top spot.",
    icon: <Trophy className="w-12 h-12 text-yellow-500" />,
    content: (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 w-full">
            <SlideInCard className="w-full">
              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-yellow-500/10 p-4 border-b border-yellow-500/20 flex justify-between items-center">
                  <h3 className="font-bold text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> Weekly Leaderboard
                  </h3>
                  <span className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">Week 42</span>
                </div>
                <div className="divide-y">
                  {[
                    { name: "Sarah", points: 450, rank: 1, color: "text-yellow-500" },
                    { name: "Mike", points: 320, rank: 2, color: "text-slate-400" },
                    { name: "You", points: 280, rank: 3, color: "text-amber-600" },
                  ].map((user) => (
                    <div key={user.rank} className="p-4 flex items-center gap-4">
                      <div className={`font-bold text-xl w-6 text-center ${user.color}`}>#{user.rank}</div>
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {user.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div className="font-mono font-bold">{user.points} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </SlideInCard>
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-semibold">Earn Points & Badges</h3>
            <p className="text-muted-foreground">
              Every task is a contribution to the community. Earn points and climb the leaderboard by serving others!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-100 dark:bg-slate-800">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Weekly Winner</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-100 dark:bg-slate-800">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Reliable</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-100 dark:bg-slate-800">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Speedy</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-100 dark:bg-slate-800">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm">Task Master</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function GuidePage() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 pb-32">
      <SlideInCard direction="down" className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-6 border border-primary/20">
          <Sparkles className="h-3.5 w-3.5" />
          Master the Platform
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-6">
          User <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Guide</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Learn how to manage your hostel life with excellence, fairness, and community spirit.
        </p>
      </SlideInCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-24 space-y-3">
            {guideSteps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left px-6 py-4 rounded-[1.5rem] transition-all flex items-center gap-4 border-2 ${
                  currentStep === index 
                    ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20" 
                    : "bg-card/50 backdrop-blur-sm border-transparent hover:border-primary/20 text-muted-foreground"
                }`}
              >
                <div className={`shrink-0 ${currentStep === index ? "text-primary-foreground" : "text-primary"}`}>
                  {index === 0 && <Home className="w-5 h-5" />}
                  {index === 1 && <Users className="w-5 h-5" />}
                  {index === 2 && <CheckSquare className="w-5 h-5" />}
                  {index === 3 && <Scale className="w-5 h-5" />}
                  {index === 4 && <Trophy className="w-5 h-5" />}
                </div>
                <span className="font-black text-sm tracking-tight">{step.title}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <div className="relative min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="bg-card/50 backdrop-blur-xl border-0 rounded-[3rem] shadow-2xl p-8 md:p-12 overflow-hidden relative"
              >
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 relative">
                  <div className="p-5 bg-primary/10 rounded-[2rem] shadow-inner">
                    {guideSteps[currentStep].icon}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">{guideSteps[currentStep].title}</h2>
                    <p className="text-lg text-muted-foreground font-bold">{guideSteps[currentStep].description}</p>
                  </div>
                </div>

                <div className="mb-12 relative min-h-[300px]">
                  {guideSteps[currentStep].content}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-primary/10 relative">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="h-14 px-8 rounded-2xl font-black gap-3 hover:bg-primary/5 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" /> Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    {guideSteps.map((_, idx) => (
                      <motion.div 
                        key={idx}
                        animate={{ 
                          width: idx === currentStep ? 32 : 8,
                          backgroundColor: idx === currentStep ? "var(--primary)" : "rgba(var(--primary), 0.2)"
                        }}
                        className="h-2 rounded-full"
                      />
                    ))}
                  </div>

                  {currentStep < guideSteps.length - 1 ? (
                    <Button 
                      onClick={nextStep} 
                      className="h-14 px-10 rounded-2xl font-black gap-3 bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      Next Step <ChevronRight className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button 
                      asChild
                      className="h-14 px-10 rounded-2xl font-black gap-3 bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 hover:scale-105 transition-transform"
                    >
                      <Link href="/spaces">
                        Get Started <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
