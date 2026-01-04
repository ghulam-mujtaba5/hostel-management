"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Scale, Info, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { CONFIG } from "@/lib/config";

interface FairnessStatus {
  canTake: boolean;
  reason: string;
  message: string;
  weeklyCount: number;
  weeklyLimit: number;
  tasksRemaining?: number;
  otherAvailable?: number;
}

interface FairnessIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function FairnessIndicator({ compact = false, showDetails = true }: FairnessIndicatorProps) {
  const { user, currentSpace } = useAuth();
  const [status, setStatus] = useState<FairnessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFairnessStatus = useCallback(async () => {
    if (!user || !currentSpace) return;
    setLoading(true);

    try {
      // Call the RPC function
      const { data, error } = await supabase
        .rpc('can_user_take_task', {
          p_user_id: user.id,
          p_space_id: currentSpace.id
        });

      if (error) {
        // Fallback to client-side calculation if RPC doesn't exist yet
        const { data: tasks } = await supabase
          .from('tasks')
          .select('completed_at, created_at')
          .eq('space_id', currentSpace.id)
          .eq('assigned_to', user.id)
          .eq('status', 'done')
          .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const weeklyCount = tasks?.length || 0;
        const weeklyLimit = CONFIG.business.fairness.maxTasksPerWeek;
        const tasksRemaining = Math.max(0, weeklyLimit - weeklyCount);

        setStatus({
          canTake: tasksRemaining > 0,
          reason: tasksRemaining > 0 ? 'within_limit' : 'weekly_limit_reached',
          message: tasksRemaining > 0 
            ? `You have ${tasksRemaining} tasks remaining this week`
            : 'Weekly limit reached - let others take tasks',
          weeklyCount,
          weeklyLimit,
          tasksRemaining
        });
      } else {
        setStatus({
          canTake: data.can_take,
          reason: data.reason,
          message: data.message || '',
          weeklyCount: data.weekly_count,
          weeklyLimit: data.weekly_limit,
          tasksRemaining: data.tasks_remaining,
          otherAvailable: data.other_available
        });
      }
    } catch (error) {
      console.error('Error fetching fairness status:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentSpace]);

  useEffect(() => {
    if (user && currentSpace) {
      fetchFairnessStatus();
    }
  }, [user, currentSpace, fetchFairnessStatus]);

  if (loading || !status) {
    return compact ? null : (
      <div className="h-16 bg-muted/30 rounded-xl animate-pulse" />
    );
  }

  const percentage = (status.weeklyCount / status.weeklyLimit) * 100;
  const isNearLimit = percentage >= 70;
  const isAtLimit = percentage >= 100;

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
        isAtLimit 
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" 
          : isNearLimit 
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" 
            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      )}>
        <Scale className="h-3 w-3" />
        {status.tasksRemaining || 0} left
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn(
        "border overflow-hidden",
        isAtLimit 
          ? "border-red-500/30 bg-red-500/5" 
          : isNearLimit 
            ? "border-yellow-500/30 bg-yellow-500/5" 
            : "border-green-500/30 bg-green-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              isAtLimit 
                ? "bg-red-500/20" 
                : isNearLimit 
                  ? "bg-yellow-500/20" 
                  : "bg-green-500/20"
            )}>
              {isAtLimit ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : isNearLimit ? (
                <Scale className="h-5 w-5 text-yellow-500" />
              ) : (
                <Shield className="h-5 w-5 text-green-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  "font-semibold",
                  isAtLimit 
                    ? "text-red-700 dark:text-red-300" 
                    : isNearLimit 
                      ? "text-yellow-700 dark:text-yellow-300" 
                      : "text-green-700 dark:text-green-300"
                )}>
                  {isAtLimit 
                    ? "Weekly Limit Reached" 
                    : isNearLimit 
                      ? "Approaching Limit" 
                      : "Fairness Balance Good"
                  }
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {status.weeklyCount}/{status.weeklyLimit}
                </Badge>
              </div>
              
              {showDetails && (
                <p className="text-sm text-muted-foreground">
                  {status.message || (
                    isAtLimit 
                      ? "You've done great this week! Let others have a chance to contribute."
                      : `You can take ${status.tasksRemaining} more tasks this week.`
                  )}
                </p>
              )}
              
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isAtLimit 
                      ? "bg-red-500" 
                      : isNearLimit 
                        ? "bg-yellow-500" 
                        : "bg-green-500"
                  )}
                />
              </div>
              
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>This week: {status.weeklyCount} tasks</span>
                <span>Limit: {status.weeklyLimit}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Tooltip version for task cards
export function FairnessTooltip() {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Info className="h-3 w-3" />
      <span>Fairness limit: max 10 tasks/week per member</span>
    </div>
  );
}
