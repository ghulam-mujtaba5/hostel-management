"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Scale, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function FairnessInfoPage() {
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
                <Scale className="h-3 w-3" />
                Fairness Algorithm
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              How It <br />
              <span className="text-primary">Works</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-xl">
              HostelMate uses an intelligent fairness algorithm to ensure duties are distributed equally among all flatmates.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            icon: <Scale className="h-6 w-6" />,
            title: "Workload Balance",
            desc: "The system tracks points for every completed task. If you have fewer points than the average of your flatmates, you'll be recommended more tasks to catch up. If you're ahead, you can relax!",
            color: "blue"
          },
          {
            icon: <Brain className="h-6 w-6" />,
            title: "Category Diversity",
            desc: "The system avoids giving you the same type of task repeatedly. If you just cleaned the kitchen, you'll likely be recommended a different category next to keep things interesting.",
            color: "purple"
          },
          {
            icon: <ShieldCheck className="h-6 w-6" />,
            title: "Verification",
            desc: "Trust but verify! Upload a photo when you finish a task. Other members can verify it, ensuring everyone does their part properly.",
            color: "green"
          }
        ].map((item, i) => (
          <Card key={i} className="border border-border/50 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6">
                <div className={`h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <div className="text-primary">{item.icon}</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border/50 shadow-sm rounded-[2rem] bg-primary/5 overflow-hidden">
        <CardContent className="p-8 md:p-12 text-center space-y-6">
          <h3 className="text-2xl font-bold tracking-tight">Ready to contribute?</h3>
          <p className="text-muted-foreground font-medium max-w-md mx-auto">
            Start picking up tasks and climb the leaderboard while keeping your hostel clean and organized.
          </p>
          <Button asChild size="lg" className="rounded-xl px-8 font-bold">
            <Link href="/tasks">View Available Tasks</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
