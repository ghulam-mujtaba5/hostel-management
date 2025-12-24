"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, Sparkles, Play, CheckCircle, Shield, Clock, 
  Users, UserPlus, ListTodo, Scale, Trophy, Zap, 
  MessageSquare, Award, Globe, Home, Star, Quote,
  ChevronRight, Rocket, Target, BarChart3, Bell, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/Toast";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { useRef, useState, useEffect } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        
        {/* Animated blobs */}
        <motion.div 
          className="blob blob-primary absolute top-[10%] right-[15%] w-[500px] h-[500px]"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="blob blob-secondary absolute bottom-[20%] left-[10%] w-[400px] h-[400px]"
          animate={{ 
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="blob blob-accent absolute top-[40%] left-[50%] w-[300px] h-[300px]"
          animate={{ 
            x: [0, 40, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-[0.02]" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-16 flex-grow relative">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col justify-center">
          <motion.div 
            style={{ y, opacity }}
            className="text-center space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              <span>The Future of Hostel Living</span>
              <ChevronRight className="h-3 w-3" />
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] text-balance"
            >
              Manage Your Space <br />
              <span className="text-gradient">With Fairness</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium text-balance"
            >
              Distribute tasks fairly, track contributions, and build harmony 
              with your flatmates. Living together made beautiful.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button size="xl" variant="glow" className="h-14 px-10 text-lg font-bold rounded-2xl" asChild>
                <Link href="/login?mode=signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl group" asChild>
                <Link href="/guide">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 pt-10"
            >
              {[
                { icon: CheckCircle, label: "100% Free", color: "text-emerald-500" },
                { icon: Shield, label: "Secure & Private", color: "text-blue-500" },
                { icon: Clock, label: "2 Min Setup", color: "text-purple-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className={cn("h-5 w-5", item.color)} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5"
            >
              <motion.div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="py-32"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Rocket className="h-3 w-3" />
              Getting Started
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get your hostel organized in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/20 via-purple-500/30 to-blue-500/20" />

            {[
              {
                step: 1,
                icon: <Users className="h-8 w-8" />,
                title: "Create Your Space",
                description: "Sign up and create a digital space for your hostel. Name it, customize it, make it yours.",
                gradient: "from-primary to-[#8b5cf6]"
              },
              {
                step: 2,
                icon: <UserPlus className="h-8 w-8" />,
                title: "Invite Flatmates",
                description: "Share your unique invite code with flatmates. They join in seconds with just the code.",
                gradient: "from-[#8b5cf6] to-blue-500"
              },
              {
                step: 3,
                icon: <ListTodo className="h-8 w-8" />,
                title: "Manage Together",
                description: "Create tasks, assign them fairly, track contributions, and maintain harmony.",
                gradient: "from-blue-500 to-cyan-500"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="text-center relative group"
              >
                <div className={cn(
                  "w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br flex items-center justify-center text-white shadow-2xl mb-8 relative",
                  "group-hover:scale-105 group-hover:shadow-primary/25 transition-all duration-500",
                  item.gradient
                )}>
                  {item.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center text-primary font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="py-32"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="h-3 w-3" />
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Powerful features designed to make shared living a breeze
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Scale className="h-7 w-7" />,
                title: "Fair Distribution",
                description: "Our AI-powered algorithm ensures everyone contributes their fair share. No more arguments!",
                color: "bg-purple-500/10 text-purple-500",
                borderColor: "hover:border-purple-500/30"
              },
              {
                icon: <Trophy className="h-7 w-7" />,
                title: "Gamified Experience",
                description: "Earn points, climb the leaderboard, and compete with flatmates. Make chores fun!",
                color: "bg-yellow-500/10 text-yellow-500",
                borderColor: "hover:border-yellow-500/30"
              },
              {
                icon: <Target className="h-7 w-7" />,
                title: "Smart Recommendations",
                description: "Get personalized task suggestions based on workload balance and category diversity.",
                color: "bg-orange-500/10 text-orange-500",
                borderColor: "hover:border-orange-500/30"
              },
              {
                icon: <Bell className="h-7 w-7" />,
                title: "Real-time Updates",
                description: "Stay notified about new tasks, completions, and changes in your space.",
                color: "bg-blue-500/10 text-blue-500",
                borderColor: "hover:border-blue-500/30"
              },
              {
                icon: <Award className="h-7 w-7" />,
                title: "Achievements & Badges",
                description: "Unlock special badges as you contribute to your hostel community.",
                color: "bg-emerald-500/10 text-emerald-500",
                borderColor: "hover:border-emerald-500/30"
              },
              {
                icon: <Globe className="h-7 w-7" />,
                title: "Works Everywhere",
                description: "Mobile-friendly design that works on phones, tablets, and desktops.",
                color: "bg-cyan-500/10 text-cyan-500",
                borderColor: "hover:border-cyan-500/30"
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className={cn(
                  "h-full border border-border/50 bg-card/50 backdrop-blur-sm",
                  "transition-all duration-300 group",
                  "hover:shadow-xl hover:-translate-y-1",
                  feature.borderColor
                )}>
                  <CardContent className="p-8 space-y-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      "transition-transform duration-300 group-hover:scale-110",
                      feature.color
                    )}>
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
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="py-32"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Heart className="h-3 w-3" />
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Loved by Students</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See what others are saying about HostelMate
            </p>
          </motion.div>

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
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full border border-border/50 bg-gradient-to-br from-card to-muted/30 hover:shadow-lg transition-all">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex gap-1 text-yellow-500">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-primary/20" />
                    <p className="text-foreground/80 italic leading-relaxed">"{testimonial.quote}"</p>
                    <div className="pt-4 border-t border-border/50">
                      <p className="font-bold text-foreground">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Final CTA Section */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-32"
        >
          <Card variant="gradient" className="overflow-hidden p-8 md:p-16 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Ready to transform your hostel life?
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Join thousands of students managing their shared spaces with HostelMate. 
                  It takes less than 2 minutes to set up.
                </p>
                <div className="space-y-3">
                  {[
                    "No credit card required",
                    "Unlimited flatmates",
                    "Works on all devices"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-5">
                  <div className="text-center mb-2">
                    <p className="font-bold text-xl">Start in seconds</p>
                    <p className="text-sm text-muted-foreground">Create your hostel space now</p>
                  </div>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Enter Hostel Name" 
                      className="h-14 pl-12 rounded-xl text-base"
                      id="hostel-name-input"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    variant="glow"
                    className="w-full h-14 rounded-xl text-lg font-bold"
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
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground font-semibold">Or</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-12 rounded-xl font-semibold" asChild>
                    <Link href="/spaces/join">Join with Invite Code</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Simple Login CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">
            Already have an account?
          </p>
          <Button size="lg" variant="ghost" className="rounded-xl px-8 font-semibold" asChild>
            <Link href="/login">
              Sign In to Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}
