"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, Sparkles, Play, CheckCircle, Shield, Clock, 
  Users, UserPlus, ListTodo, Scale, Trophy, Zap, 
  MessageSquare, Award, Globe, Home, Star, Quote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/Toast";
import { Footer } from "@/components/Footer";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Hero Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl opacity-50" />
        <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-32 flex-grow">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4"
          >
            <Sparkles className="h-4 w-4" />
            <span>The Future of Hostel Living</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]"
          >
            Manage Your Space <br />
            <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
              With Justice & Ease
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Living together is a trust (Amanah). HostelMate helps you distribute tasks fairly, 
            track contributions, and build a harmonious community with your flatmates.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all group" asChild>
              <Link href="/login?mode=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-bold border-2 group" asChild>
              <Link href="/guide">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch How It Works
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-8 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Setup in 2 min</span>
            </div>
          </motion.div>
        </div>

        {/* How It Works - Step by Step */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get your hostel organized in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20" />

            {[
              {
                step: 1,
                icon: <Users className="h-7 w-7" />,
                title: "Create Your Space",
                description: "Sign up and create a digital space for your hostel. Name it, customize it, make it yours.",
                color: "from-primary to-purple-500"
              },
              {
                step: 2,
                icon: <UserPlus className="h-7 w-7" />,
                title: "Invite Flatmates",
                description: "Share your unique invite code with flatmates. They join in seconds with just the code.",
                color: "from-purple-500 to-blue-500"
              },
              {
                step: 3,
                icon: <ListTodo className="h-7 w-7" />,
                title: "Manage Together",
                description: "Create tasks, assign them fairly, track contributions, and maintain harmony.",
                color: "from-blue-500 to-cyan-500"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                {/* Step number badge */}
                <div className={cn(
                  "w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br flex items-center justify-center text-white shadow-xl mb-6 relative",
                  item.color
                )}>
                  {item.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {[
            {
              icon: <Scale className="h-8 w-8 text-purple-500" />,
              title: "Fair Distribution",
              description: "Our AI-powered fairness algorithm ensures everyone contributes their fair share. No more arguments!",
              color: "bg-purple-500/10"
            },
            {
              icon: <Trophy className="h-8 w-8 text-yellow-500" />,
              title: "Gamified Experience",
              description: "Earn points, climb the leaderboard, and compete with flatmates. Make chores fun!",
              color: "bg-yellow-500/10"
            },
            {
              icon: <Zap className="h-8 w-8 text-orange-500" />,
              title: "Smart Recommendations",
              description: "Get personalized task suggestions based on your schedule and preferences.",
              color: "bg-orange-500/10"
            },
            {
              icon: <MessageSquare className="h-8 w-8 text-green-500" />,
              title: "Give Feedback",
              description: "Anonymously rate task completion and provide constructive feedback to flatmates.",
              color: "bg-green-500/10"
            },
            {
              icon: <Award className="h-8 w-8 text-blue-500" />,
              title: "Achievements & Badges",
              description: "Unlock special badges and achievements as you contribute to your hostel community.",
              color: "bg-blue-500/10"
            },
            {
              icon: <Globe className="h-8 w-8 text-cyan-500" />,
              title: "Works Everywhere",
              description: "Access from any device. Mobile-friendly design that works on phones, tablets, and desktops.",
              color: "bg-cyan-500/10"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all group hover:-translate-y-1 duration-300">
                <CardContent className="pt-8 space-y-4">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", feature.color)}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Loved by Students</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See what others are saying about HostelMate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Finally, no more fights about whose turn it is to clean the bathroom. The points system actually makes us want to do chores!",
                author: "Sarah K.",
                role: "University Student",
                rating: 5
              },
              {
                quote: "The fairness algorithm is genius. It really balances things out when someone has exams or is busy.",
                author: "Ahmed M.",
                role: "Flat Share",
                rating: 5
              },
              {
                quote: "Setup was super easy. We were up and running in minutes. The mobile view is perfect for quick updates.",
                author: "Jessica T.",
                role: "Hostel Resident",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-card to-muted/50">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex gap-1 text-yellow-500">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-primary/20" />
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                    <div className="pt-4 border-t border-border/50">
                      <p className="font-bold">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Start Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-20"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 backdrop-blur-xl rounded-[3rem] overflow-hidden p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-black">Ready to transform your hostel life?</h2>
                <p className="text-lg text-muted-foreground">
                  Join thousands of students managing their shared spaces with HostelMate. 
                  It takes less than 2 minutes to set up.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">Unlimited flatmates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">Works on all devices</span>
                  </div>
                </div>
              </div>
              <div className="bg-card/80 border border-border/50 rounded-[2rem] p-6 shadow-xl">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="font-bold text-lg">Start in seconds</p>
                    <p className="text-sm text-muted-foreground">Create your hostel space now</p>
                  </div>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Enter Hostel Name" 
                      className="h-14 pl-12 rounded-2xl text-lg border-primary/20 focus:border-primary transition-all"
                      id="hostel-name-input"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-purple-600"
                    onClick={() => {
                      const name = (document.getElementById('hostel-name-input') as HTMLInputElement).value;
                      if (name.trim()) {
                        window.location.href = `/login?hostelName=${encodeURIComponent(name)}&mode=signup`;
                      } else {
                        toast.error("Please enter a hostel name");
                      }
                    }}
                  >
                    Create Community
                  </Button>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground font-bold">Or</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-primary/20" asChild>
                    <Link href="/spaces/join">Join with Invite Code</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">
            Already have an account?
          </p>
          <Button size="lg" variant="outline" className="rounded-2xl px-8" asChild>
            <Link href="/login">
              Sign In to Your Account
            </Link>
          </Button>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}
