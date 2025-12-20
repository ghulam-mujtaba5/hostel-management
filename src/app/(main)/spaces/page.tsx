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
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">Please sign in to manage your hostel spaces and view your flatmates.</p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/profile">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Spaces</h1>
            <p className="text-muted-foreground">Manage your hostel communities</p>
          </div>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Home className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Space List */}
      <div className="space-y-4">
        {userSpaces.length === 0 ? (
          <SlideInCard direction="up">
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Spaces Found</h3>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                  You haven't joined any hostel spaces yet. Create one for your flat or join an existing one.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="rounded-full">
                    <Link href="/spaces/create">
                      <Plus className="mr-2 h-5 w-5" />
                      Create Space
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="rounded-full">
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
                      currentSpace?.id === space.id 
                        ? 'ring-2 ring-primary border-primary/50 bg-primary/5' 
                        : 'hover:border-primary/30'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors ${
                            currentSpace?.id === space.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Users className="h-7 w-7" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{space.name}</h3>
                              {currentSpace?.id === space.id && (
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                <span>Code: {space.invite_code}</span>
                                <button
                                  onClick={() => copyInviteCode(space.invite_code)}
                                  className="ml-1 hover:text-foreground transition-colors"
                                >
                                  {copied === space.invite_code ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>Hostel Block A</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyInviteLink(space.invite_code)}
                            className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Share Invite Link"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {currentSpace?.id !== space.id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setCurrentSpace(space)}
                              className="rounded-full px-4"
                            >
                              Switch
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" asChild className="rounded-full">
                            <Link href={`/spaces/${space.id}`}>
                              <Settings className="h-5 w-5 text-muted-foreground" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      {currentSpace?.id === space.id && (
                        <div className="px-5 py-3 bg-primary/10 border-t border-primary/10 flex items-center justify-between">
                          <span className="text-xs font-medium text-primary flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary" />
                            Currently Active Space
                          </span>
                          <Link 
                            href="/" 
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Go to Dashboard →
                          </Link>
                        </div>
                      )}
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
        <SlideInCard direction="left" delay={0.3}>
          <Button 
            variant="outline" 
            className="w-full h-24 flex-col gap-2 rounded-3xl border-2 hover:border-primary hover:bg-primary/5 transition-all group" 
            asChild
          >
            <Link href="/spaces/create">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-bold">Create New Space</span>
            </Link>
          </Button>
        </SlideInCard>
        
        <SlideInCard direction="right" delay={0.4}>
          <Button 
            variant="outline" 
            className="w-full h-24 flex-col gap-2 rounded-3xl border-2 hover:border-primary hover:bg-primary/5 transition-all group" 
            asChild
          >
            <Link href="/spaces/join">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <span className="font-bold">Join Existing Space</span>
            </Link>
          </Button>
        </SlideInCard>
      </div>
    </div>
  );
}
