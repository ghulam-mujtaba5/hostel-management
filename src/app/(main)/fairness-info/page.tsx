"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Scale, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function FairnessInfoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">How It Works</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-muted-foreground">
          HostelMate uses an intelligent fairness algorithm to ensure duties are distributed equally among all flatmates.
          Here's how the system decides which tasks to recommend to you.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Scale className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Workload Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The system tracks points for every completed task. If you have fewer points than the average of your flatmates,
              you'll be recommended more tasks to catch up. If you're ahead, you can relax!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Brain className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Difficulty Shuffling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Not all tasks are equal. Cleaning the washroom is harder than taking out trash. 
              The system ensures no one gets stuck doing only "hard" tasks. If you did a difficult task recently,
              you'll be recommended easier ones next.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <Heart className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Your Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We respect your choices. You can mark tasks as "Preferred" or "Avoid". 
              While fairness comes first, the system tries to give you tasks you enjoy whenever possible.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Trust but verify! Upload a photo when you finish a task. 
              Other members can verify it, ensuring everyone does their part properly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
