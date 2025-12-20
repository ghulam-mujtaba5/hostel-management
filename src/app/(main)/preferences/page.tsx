"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Heart, X, Info } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { TASK_CATEGORIES, TaskCategory } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";
import { toast } from "@/components/Toast";

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
  };

  const toggleAvoided = (category: TaskCategory) => {
    if (avoidedCategories.includes(category)) {
      setAvoidedCategories(prev => prev.filter(c => c !== category));
    } else {
      setAvoidedCategories(prev => [...prev, category]);
      setPreferredCategories(prev => prev.filter(c => c !== category));
    }
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
    <div className="space-y-6">
      <SlideInCard direction="down" delay={0}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Task Preferences
            </h1>
            <p className="text-sm text-muted-foreground">Customize your task recommendations</p>
          </div>
        </div>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.1}>
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              Preferred Tasks
            </CardTitle>
            <CardDescription>
              Tasks you enjoy doing. The system will recommend these more often when available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => {
                const isSelected = preferredCategories.includes(key as TaskCategory);
                return (
                  <motion.button
                    key={key}
                    onClick={() => togglePreferred(key as TaskCategory)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-xl border-2 text-center transition-all relative overflow-hidden ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 shadow-md' 
                        : 'border-border hover:bg-muted/50 hover:border-green-300'
                    }`}
                  >
                    <motion.span 
                      className="text-2xl block"
                      animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {emoji}
                    </motion.span>
                    <p className="text-xs mt-1 font-medium">{label}</p>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-1 right-1"
                        >
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.2}>
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Tasks to Avoid
            </CardTitle>
            <CardDescription>
              Tasks you'd prefer not to do. The system will recommend these less (but fairness still applies).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => {
                const isSelected = avoidedCategories.includes(key as TaskCategory);
                return (
                  <motion.button
                    key={key}
                    onClick={() => toggleAvoided(key as TaskCategory)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-xl border-2 text-center transition-all relative overflow-hidden ${
                      isSelected 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 shadow-md' 
                        : 'border-border hover:bg-muted/50 hover:border-red-300'
                    }`}
                  >
                    <motion.span 
                      className="text-2xl block"
                      animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {emoji}
                    </motion.span>
                    <p className="text-xs mt-1 font-medium">{label}</p>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-1 right-1"
                        >
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.3}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button 
            onClick={handleSave} 
            className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" 
            disabled={saving}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Saving...
                </motion.span>
              ) : saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Saved!
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Save Preferences
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </SlideInCard>

      <SlideInCard direction="up" delay={0.4}>
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                These preferences influence recommendations but don't guarantee you won't get tasks you want to avoid. 
                <strong className="text-foreground"> Fairness comes first!</strong> Everyone needs to pitch in equally.
              </p>
            </div>
          </CardContent>
        </Card>
      </SlideInCard>
    </div>
  );
}
