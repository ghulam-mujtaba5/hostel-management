"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { 
  Sparkles, 
  Upload, 
  Camera, 
  ArrowLeft, 
  Coins, 
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TASK_CATEGORIES, TaskCategory, TaskToken, TaskRequest } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SlideInCard } from "@/components/Animations";
import { cn } from "@/lib/utils";

export default function RequestCleaningPage() {
  const { user, currentSpace } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TaskToken | null>(null);
  const [myRequests, setMyRequests] = useState<TaskRequest[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as TaskCategory,
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    proofImage: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentSpace && user) {
      fetchTokenInfo();
      fetchMyRequests();
    }
  }, [currentSpace, user]);

  const fetchTokenInfo = async () => {
    if (!currentSpace || !user) return;

    const { data, error } = await supabase
      .from("task_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("space_id", currentSpace.id)
      .single();

    if (data) {
      setTokenInfo(data);
    } else if (error && error.code === "PGRST116") {
      // No token record exists, will be created on first request
      setTokenInfo({
        id: "",
        user_id: user.id,
        space_id: currentSpace.id,
        tokens_used: 0,
        max_tokens: 5,
        period_start: new Date().toISOString(),
        period_type: "weekly",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  const fetchMyRequests = async () => {
    if (!currentSpace || !user) return;

    const { data } = await supabase
      .from("task_requests")
      .select(`
        *,
        assignee:assigned_to(id, username, full_name, avatar_url)
      `)
      .eq("space_id", currentSpace.id)
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setMyRequests(data);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, proofImage: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentSpace || !tokenInfo) return;

    if (tokenInfo.tokens_used >= tokenInfo.max_tokens) {
      toast.error("You've used all your request tokens for this period!");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please provide a title for your request");
      return;
    }

    setLoading(true);

    try {
      let proofImageUrl = null;

      // Upload image if provided
      if (formData.proofImage) {
        const fileExt = formData.proofImage.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("task-images")
          .upload(fileName, formData.proofImage);

        if (uploadError) {
          console.error("Image upload error:", uploadError);
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("task-images")
            .getPublicUrl(uploadData.path);
          proofImageUrl = urlData.publicUrl;
        }
      }

      // Create the request
      const { error: requestError } = await supabase
        .from("task_requests")
        .insert({
          space_id: currentSpace.id,
          requester_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          priority: formData.priority,
          proof_image_url: proofImageUrl,
          token_cost: 1,
        });

      if (requestError) throw requestError;

      // Update token usage
      const { error: tokenError } = await supabase
        .from("task_tokens")
        .upsert({
          user_id: user.id,
          space_id: currentSpace.id,
          tokens_used: (tokenInfo.tokens_used || 0) + 1,
          max_tokens: tokenInfo.max_tokens,
          updated_at: new Date().toISOString(),
        });

      if (tokenError) {
        console.error("Token update error:", tokenError);
      }

      toast.success("Cleaning request submitted successfully!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "other",
        priority: "normal",
        proofImage: null,
      });
      setPreviewUrl(null);
      
      // Refresh data
      fetchTokenInfo();
      fetchMyRequests();
    } catch (err: any) {
      console.error("Request submission error:", err);
      toast.error(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const tokensRemaining = tokenInfo ? tokenInfo.max_tokens - tokenInfo.tokens_used : 5;
  const tokensPercentage = tokenInfo ? ((tokenInfo.max_tokens - tokenInfo.tokens_used) / tokenInfo.max_tokens) * 100 : 100;

  if (!currentSpace) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="h-20 w-20 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-black mb-2">Join a Hostel First</h2>
        <p className="text-muted-foreground font-medium mb-8">You need to be part of a hostel to request cleaning help.</p>
        <Button asChild size="lg" className="rounded-2xl px-10 font-black">
          <Link href="/spaces">My Hostels</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <SlideInCard direction="down">
        <div className="flex items-center gap-6 mb-8">
          <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-2xl bg-muted/50 hover:bg-muted">
            <Link href="/tasks">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Request Cleaning</h1>
            <p className="text-muted-foreground font-bold">Ask your flatmates for help with a task</p>
          </div>
        </div>
      </SlideInCard>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Token Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <SlideInCard direction="left" delay={0.1}>
            <Card className="border-0 shadow-xl rounded-[2rem] bg-gradient-to-br from-primary/5 to-purple-500/5 overflow-hidden">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Coins className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Request Tokens</CardTitle>
                <CardDescription>Use tokens to request cleaning help</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="text-center">
                  <div className="text-5xl font-black text-primary">{tokensRemaining}</div>
                  <p className="text-sm text-muted-foreground font-medium">tokens remaining</p>
                </div>
                
                <div className="space-y-2">
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${tokensPercentage}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {tokenInfo?.tokens_used || 0} of {tokenInfo?.max_tokens || 5} used this {tokenInfo?.period_type || 'week'}
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">Why tokens?</p>
                      <p className="text-muted-foreground mt-1">
                        Tokens ensure fair use. Everyone gets {tokenInfo?.max_tokens || 5} requests per {tokenInfo?.period_type || 'week'} 
                        to prevent overloading flatmates.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SlideInCard>

          {/* My Recent Requests */}
          {myRequests.length > 0 && (
            <SlideInCard direction="left" delay={0.2}>
              <Card className="border-0 shadow-xl rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-lg">Your Recent Requests</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {myRequests.slice(0, 3).map((req) => (
                    <div 
                      key={req.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                        req.status === 'completed' && "bg-green-100 text-green-700",
                        req.status === 'pending' && "bg-yellow-100 text-yellow-700",
                        req.status === 'in_progress' && "bg-blue-100 text-blue-700",
                        req.status === 'rejected' && "bg-red-100 text-red-700",
                      )}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </SlideInCard>
          )}
        </div>

        {/* Request Form */}
        <div className="lg:col-span-2">
          <SlideInCard direction="up" delay={0.15}>
            <Card className="border-0 shadow-xl rounded-[2rem]">
              <CardHeader>
                <CardTitle>New Request</CardTitle>
                <CardDescription>
                  Describe what you need help with. Upload a photo to show the current state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tokensRemaining <= 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-[2rem] bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Tokens Left</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      You've used all your request tokens for this {tokenInfo?.period_type}. 
                      Your tokens will reset at the start of the next {tokenInfo?.period_type}.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Tokens reset {tokenInfo?.period_type === 'weekly' ? 'every Monday' : 'on the 1st'}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="font-bold">What do you need?</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Kitchen needs cleaning, Bathroom floor is dirty"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-bold">Details (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Add any extra details about what needs to be done..."
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                        className="rounded-xl min-h-[100px]"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold">Category</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(TASK_CATEGORIES).map(([key, value]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setFormData({ ...formData, category: key as TaskCategory })}
                              className={cn(
                                "p-3 rounded-xl text-center transition-all",
                                formData.category === key 
                                  ? "bg-primary/10 ring-2 ring-primary" 
                                  : "bg-muted/50 hover:bg-muted"
                              )}
                            >
                              <span className="text-xl">{value.emoji}</span>
                              <span className="sr-only">{value.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold">Priority</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['low', 'normal', 'high', 'urgent'] as const).map((priority) => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => setFormData({ ...formData, priority })}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                                formData.priority === priority 
                                  ? "ring-2" 
                                  : "bg-muted/50 hover:bg-muted",
                                priority === 'low' && formData.priority === priority && "bg-green-100 text-green-700 ring-green-500",
                                priority === 'normal' && formData.priority === priority && "bg-blue-100 text-blue-700 ring-blue-500",
                                priority === 'high' && formData.priority === priority && "bg-orange-100 text-orange-700 ring-orange-500",
                                priority === 'urgent' && formData.priority === priority && "bg-red-100 text-red-700 ring-red-500",
                              )}
                            >
                              {priority}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Photo (optional but helpful)</Label>
                      <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
                        {previewUrl ? (
                          <div className="relative">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="max-h-48 mx-auto rounded-xl object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 rounded-lg"
                              onClick={() => {
                                setPreviewUrl(null);
                                setFormData({ ...formData, proofImage: null });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="font-semibold">Click to upload a photo</p>
                            <p className="text-sm text-muted-foreground">Show the current state of what needs cleaning</p>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-purple-600"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5" />
                            Submit Request (-1 token)
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </SlideInCard>
        </div>
      </div>
    </div>
  );
}
