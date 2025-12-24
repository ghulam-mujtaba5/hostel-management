"use client";

import { InsightsDashboard } from "@/components/insights/InsightsDashboard";

export default function InsightsPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">
          Detailed analytics about your performance and contributions.
        </p>
      </div>
      
      <InsightsDashboard />
    </div>
  );
}
