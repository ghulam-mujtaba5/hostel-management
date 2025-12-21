"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Copy, Check, ArrowLeft, Settings, Home, MapPin, Star, Shield, Share2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Space } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";
import { toast } from "sonner";

export default function SpacesPage() {
  const { user, userSpaces, currentSpace, setCurrentSpace, refreshSpaces } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success("Code copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-24 w-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-8">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-3xl font-black mb-3">Authentication Required</h2>
        <p className="text-muted-foreground mb-10 max-w-xs font-medium">Please sign in to manage your hostel spaces and view your flatmates.</p>
        <Button asChild size="lg" className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-primary/20">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32">
      {/* Header */}
      <SlideInCard direction="down">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl bg-muted/30 hover:bg-muted">
              <Link href="/profile">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Spaces</h1>
              <p className="text-muted-foreground font-medium text-sm">Manage your hostel communities</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Home className="h-6 w-6 text-primary" />
          </div>
        </div>
      </SlideInCard>

      {/* Space List */}
      <div className="space-y-6">
        {userSpaces.length === 0 ? (
          <SlideInCard direction="up">
            <Card className="border-2 border-dashed border-border/50 bg-muted/10 rounded-[2rem]">
              <CardContent className="py-20 text-center">
                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No Spaces Found</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-medium text-sm">
                  You haven't joined any hostel spaces yet. Create one for your flat or join an existing one to start tracking tasks.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="rounded-xl h-12 px-8 font-bold">
                    <Link href="/spaces/create">
                      <Plus className="mr-2 h-5 w-5" />
                      Create Space
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="rounded-xl h-12 px-8 font-bold">
                    <Link href="/spaces/join">Join Space</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SlideInCard>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {userSpaces.map((space, index) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`overflow-hidden transition-all duration-300 border border-border/50 shadow-sm rounded-2xl group ${
                      currentSpace?.id === space.id 
                        ? 'bg-primary/5 ring-1 ring-primary/20' 
                        : 'bg-white dark:bg-slate-900 hover:border-primary/30'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                            currentSpace?.id === space.id ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Users className="h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xl tracking-tight">{space.name}</h3>
                              {currentSpace?.id === space.id && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-wider">
                                  <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                  Active
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                onClick={() => copyInviteCode(space.invite_code)}
                                className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                              >
                                <span>Code: {space.invite_code}</span>
                                {copied === space.invite_code ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <MapPin className="h-3 w-3" />
                                <span>Hostel Block A</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            onClick={() => copyInviteLink(space.invite_code)}
                            className="rounded-xl h-10 w-10 shadow-sm"
                            title="Share Invite Link"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          
                          {currentSpace?.id !== space.id ? (
                            <Button 
                              size="sm" 
                              onClick={() => setCurrentSpace(space)}
                              className="rounded-xl px-6 font-bold h-10"
                            >
                              Switch
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              asChild
                              className="rounded-xl px-6 font-bold h-10 shadow-sm"
                            >
                              <Link href="/">Dashboard</Link>
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 hover:bg-muted">
                            <Link href={`/spaces/${space.id}`}>
                              <Settings className="h-5 w-5 text-muted-foreground" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SlideInCard direction="left" delay={0.2}>
          <Link href="/spaces/create" className="group block">
            <div className="h-28 rounded-[2rem] border border-border/50 bg-white dark:bg-slate-900 hover:border-primary/30 transition-all flex items-center gap-5 px-6 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <span className="block font-bold text-lg">Create Space</span>
                <span className="text-xs text-muted-foreground font-medium">Start a new community</span>
              </div>
            </div>
          </Link>
        </SlideInCard>
        
        <SlideInCard direction="right" delay={0.3}>
          <Link href="/spaces/join" className="group block">
            <div className="h-28 rounded-[2rem] border border-border/50 bg-white dark:bg-slate-900 hover:border-primary/30 transition-all flex items-center gap-5 px-6 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="block font-bold text-lg">Join Space</span>
                <span className="text-xs text-muted-foreground font-medium">Enter an invite code</span>
              </div>
            </div>
          </Link>
        </SlideInCard>
      </div>
    </div>
  );
}
