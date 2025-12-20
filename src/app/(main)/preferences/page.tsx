"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TASK_CATEGORIES, TaskCategory } from "@/types";

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
      // Remove from avoided if adding to preferred
      setAvoidedCategories(prev => prev.filter(c => c !== category));
    }
  };

  const toggleAvoided = (category: TaskCategory) => {
    if (avoidedCategories.includes(category)) {
      setAvoidedCategories(prev => prev.filter(c => c !== category));
    } else {
      setAvoidedCategories(prev => [...prev, category]);
      // Remove from preferred if adding to avoided
      setPreferredCategories(prev => prev.filter(c => c !== category));
    }
  };

  const handleSave = async () => {
    if (!user || !currentSpace) return;
    
    setSaving(true);
    
    // For now, store in local storage (could be moved to a preferences table)
    localStorage.setItem(`prefs_${currentSpace.id}_${user.id}`, JSON.stringify({
      preferred: preferredCategories,
      avoided: avoidedCategories,
    }));
    
    setSaving(false);
    setSaved(true);
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Task Preferences</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferred Tasks</CardTitle>
          <CardDescription>
            Tasks you enjoy doing. System will recommend these more often.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => {
              const isSelected = preferredCategories.includes(key as TaskCategory);
              return (
                <button
                  key={key}
                  onClick={() => togglePreferred(key as TaskCategory)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 text-green-800' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <p className="text-xs mt-1">{label}</p>
                  {isSelected && <Check className="h-3 w-3 mx-auto mt-1 text-green-600" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tasks to Avoid</CardTitle>
          <CardDescription>
            Tasks you'd prefer not to do. System will recommend these less (but fairness still applies).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(TASK_CATEGORIES).map(([key, { label, emoji }]) => {
              const isSelected = avoidedCategories.includes(key as TaskCategory);
              return (
                <button
                  key={key}
                  onClick={() => toggleAvoided(key as TaskCategory)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    isSelected 
                      ? 'border-red-500 bg-red-50 text-red-800' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <p className="text-xs mt-1">{label}</p>
                  {isSelected && <Check className="h-3 w-3 mx-auto mt-1 text-red-600" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Note: These preferences influence recommendations but don't guarantee you won't get tasks you want to avoid - fairness comes first!
      </p>
    </div>
  );
}
