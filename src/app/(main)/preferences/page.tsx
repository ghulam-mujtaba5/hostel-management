"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Heart, X, Info, Sparkles, HelpCircle, RotateCcw, BookOpen } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { TASK_CATEGORIES, TaskCategory } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";
import { toast } from "@/components/Toast";
import { LoadingButton } from "@/components/LoadingButton";

export default function PreferencesPage() {
  const { user, currentSpace } = useAuth();
  const [preferredCategories, setPreferredCategories] = useState<TaskCategory[]>([]);
  const [avoidedCategories, setAvoidedCategories] = useState<TaskCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePreferred = (category: TaskCategory) => {
    if (preferredCategories.includes(category)) {
      setPreferredCategories(prev => prev.filter(c => c !== category));
    } else {
      setPreferredCategories(prev => [...prev, category]);
      setAvoidedCategories(prev => prev.filter(c => c !== category));
    }
    setSaved(false);
  };

  const toggleAvoided = (category: TaskCategory) => {
    if (avoidedCategories.includes(category)) {
      setAvoidedCategories(prev => prev.filter(c => c !== category));
    } else {
      setAvoidedCategories(prev => [...prev, category]);
      setPreferredCategories(prev => prev.filter(c => c !== category));
    }
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user || !currentSpace) return;
    
    setSaving(true);
    
    localStorage.setItem(`prefs_${currentSpace.id}_${user.id}`, JSON.stringify({
      preferred: preferredCategories,
      avoided: avoidedCategories,
    }));
    
    setSaving(false);
    setSaved(true);
    toast.success('Preferences saved!', { emoji: '💾' });
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (user && currentSpace) {
      const stored = localStorage.getItem(`prefs_${currentSpace.id}_${user.id}`);
      if (stored) {
        const prefs = JSON.parse(stored);
        setPreferredCategories(prefs.preferred || []);
        setAvoidedCategories(prefs.avoided || []);
      }
    }
  }, [user, currentSpace]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to set preferences</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl bg-muted/30 hover:bg-muted">
                <Link href="/profile">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <Heart className="h-3 w-3" />
                Personalization
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Task <br />
              <span className="text-primary">Preferences</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Customize your task recommendations to suit your style.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <SlideInCard direction="up" delay={0.1}>
          <Card className="border border-border/50 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold">Preferred Tasks</CardTitle>
              </div>
              <CardDescription className="font-medium">
                Tasks you enjoy doing. The system will recommend these more often when available.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => {
                  const isSelected = preferredCategories.includes(key as TaskCategory);
                  return (
                    <motion.button
                      key={key}
                      onClick={() => togglePreferred(key as TaskCategory)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col items-center gap-2 ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/5 text-green-700 dark:text-green-400 shadow-sm' 
                          : 'border-border/50 hover:border-green-300 bg-muted/30'
                      }`}
                    >
                      <span className="text-3xl">{emoji}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        <SlideInCard direction="up" delay={0.2}>
          <Card className="border border-border/50 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold">Tasks to Avoid</CardTitle>
              </div>
              <CardDescription className="font-medium">
                Tasks you'd prefer not to do. The system will recommend these less often.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => {
                  const isSelected = avoidedCategories.includes(key as TaskCategory);
                  return (
                    <motion.button
                      key={key}
                      onClick={() => toggleAvoided(key as TaskCategory)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col items-center gap-2 ${
                        isSelected 
                          ? 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-400 shadow-sm' 
                          : 'border-border/50 hover:border-red-300 bg-muted/30'
                      }`}
                    >
                      <span className="text-3xl">{emoji}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <X className="h-3 w-3 text-red-600" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        <SlideInCard direction="up" delay={0.3}>
          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleSave} 
              className="w-full h-14 rounded-2xl font-bold text-lg shadow-sm" 
              disabled={saving}
            >
              <AnimatePresence mode="wait">
                {saving ? (
                  <motion.span key="saving">Saving...</motion.span>
                ) : saved ? (
                  <motion.span key="saved" className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Preferences Saved!
                  </motion.span>
                ) : (
                  <motion.span key="save">Save Preferences</motion.span>
                )}
              </AnimatePresence>
            </Button>

            <Card className="bg-muted/30 border-dashed border-border/50 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    These preferences influence recommendations but don't guarantee you won't get tasks you want to avoid. 
                    <span className="text-foreground font-bold"> Fairness comes first!</span> Everyone needs to pitch in equally to maintain the community.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SlideInCard>

        {/* Help & Support Section */}
        <SlideInCard direction="up" delay={0.4}>
          <Card className="border border-border/50 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold">Help & Support</CardTitle>
              </div>
              <CardDescription className="font-medium">
                Need assistance? Here are some helpful resources.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid sm:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto py-4 rounded-2xl justify-start gap-4" asChild>
                  <Link href="/guide">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">User Guide</p>
                      <p className="text-xs text-muted-foreground">Learn how to use HostelMate</p>
                    </div>
                  </Link>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-4 rounded-2xl justify-start gap-4"
                  onClick={() => {
                    // Reset onboarding states
                    localStorage.removeItem("hostelmate_welcome_seen");
                    localStorage.removeItem("hostelmate_tour_completed");
                    localStorage.removeItem("hostelmate_dashboard_seen");
                    localStorage.removeItem("hostelmate_checklist_dismissed");
                    localStorage.removeItem("hostelmate_banner_dismissed");
                    toast.success("Onboarding reset! Visit the dashboard to see the welcome tour again.");
                  }}
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <RotateCcw className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Reset Onboarding</p>
                    <p className="text-xs text-muted-foreground">See the welcome tour again</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>
    </div>
  );
}
