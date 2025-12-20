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
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-2xl bg-muted/50 hover:bg-muted">
              <Link href="/profile">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Your Spaces</h1>
              <p className="text-muted-foreground font-bold">Manage your hostel communities</p>
            </div>
          </div>
          <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center shadow-inner">
            <Home className="h-8 w-8 text-primary" />
          </div>
        </div>
      </SlideInCard>

      {/* Space List */}
      <div className="space-y-6">
        {userSpaces.length === 0 ? (
          <SlideInCard direction="up">
            <Card className="border-4 border-dashed border-muted bg-muted/20 rounded-[3rem]">
              <CardContent className="py-24 text-center">
                <div className="h-24 w-24 rounded-[2.5rem] bg-muted flex items-center justify-center mx-auto mb-8">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-black mb-3">No Spaces Found</h3>
                <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium">
                  You haven't joined any hostel spaces yet. Create one for your flat or join an existing one to start tracking tasks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-black bg-primary shadow-xl shadow-primary/20">
                    <Link href="/spaces/create">
                      <Plus className="mr-2 h-6 w-6" />
                      Create Space
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="rounded-2xl h-14 px-8 font-black border-2">
                    <Link href="/spaces/join">Join Space</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SlideInCard>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {userSpaces.map((space, index) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`overflow-hidden transition-all duration-500 border-0 shadow-xl rounded-[2.5rem] group ${
                      currentSpace?.id === space.id 
                        ? 'bg-primary/5 ring-2 ring-primary' 
                        : 'bg-card/50 backdrop-blur-sm hover:bg-card/80'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                            currentSpace?.id === space.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Users className="h-10 w-10" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-black text-2xl tracking-tight">{space.name}</h3>
                              {currentSpace?.id === space.id && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  Active
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                              <button
                                onClick={() => copyInviteCode(space.invite_code)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                              >
                                <span>Code: {space.invite_code}</span>
                                {copied === space.invite_code ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Hostel Block A</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            onClick={() => copyInviteLink(space.invite_code)}
                            className="rounded-2xl h-12 w-12 shadow-sm hover:scale-110 transition-transform"
                            title="Share Invite Link"
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                          
                          {currentSpace?.id !== space.id ? (
                            <Button 
                              size="lg" 
                              onClick={() => setCurrentSpace(space)}
                              className="rounded-2xl px-8 font-black bg-background text-foreground border-2 hover:bg-muted transition-all"
                            >
                              Switch
                            </Button>
                          ) : (
                            <Button 
                              size="lg" 
                              asChild
                              className="rounded-2xl px-8 font-black bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                            >
                              <Link href="/">Dashboard</Link>
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="icon" asChild className="rounded-2xl h-12 w-12 hover:bg-muted">
                            <Link href={`/spaces/${space.id}`}>
                              <Settings className="h-6 w-6 text-muted-foreground" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SlideInCard direction="left" delay={0.3}>
          <Link href="/spaces/create" className="group block">
            <div className="h-32 rounded-[2.5rem] border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-6 px-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:rotate-90">
                <Plus className="h-8 w-8" />
              </div>
              <div>
                <span className="block font-black text-xl">Create Space</span>
                <span className="text-sm text-muted-foreground font-medium">Start a new community</span>
              </div>
            </div>
          </Link>
        </SlideInCard>
        
        <SlideInCard direction="right" delay={0.4}>
          <Link href="/spaces/join" className="group block">
            <div className="h-32 rounded-[2.5rem] border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-6 px-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:scale-110">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <span className="block font-black text-xl">Join Space</span>
                <span className="text-sm text-muted-foreground font-medium">Enter an invite code</span>
              </div>
            </div>
          </Link>
        </SlideInCard>
      </div>
    </div>
  );
}
