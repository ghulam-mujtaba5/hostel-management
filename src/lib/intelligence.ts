import { SupabaseClient } from '@supabase/supabase-js';
import { Task, FairnessStats, TaskCategory, TASK_CATEGORIES } from '@/types';
import { calculateFairnessScore } from './fairness';

export interface IntelligenceInsight {
  id?: string;
  type: 'prediction' | 'anomaly' | 'suggestion';
  title: string;
  description: string;
  confidence: number; // 0-1
  relatedUserId?: string;
  relatedTaskId?: string;
  action?: 'create_task' | 'remind_user' | 'assign_task';
  metadata?: Record<string, any>;
  status?: 'pending' | 'accepted' | 'rejected' | 'snoozed';
}

export interface UserHabit {
  userId: string;
  preferredCategories: TaskCategory[];
  averageDaysBetweenTasks: number;
  usualTimeOfDay: string; // 'morning', 'afternoon', 'evening'
  consistencyScore: number; // 0-100
}

/**
 * Get or generate insights for a space
 */
export async function getSpaceInsights(
  supabase: SupabaseClient,
  spaceId: string,
  currentUserId: string
): Promise<IntelligenceInsight[]> {
  // 1. Check DB for existing pending suggestions for this user
  const { data: existing } = await supabase
    .from('task_suggestions')
    .select('*')
    .eq('space_id', spaceId)
    .eq('user_id', currentUserId)
    .eq('status', 'pending')
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

  if (existing && existing.length > 0) {
    return existing.map(row => ({
      id: row.id,
      type: row.suggestion_type === 'new_task' ? 'prediction' : row.suggestion_type === 'reminder' ? 'anomaly' : 'suggestion',
      title: row.title,
      description: row.reason,
      confidence: row.confidence_score,
      status: row.status,
      action: row.suggestion_type === 'new_task' ? 'create_task' : 'remind_user'
    }));
  }

  // 2. Generate new insights
  const insights = await analyzeSpaceIntelligence(supabase, spaceId);

  // 3. Save to DB (only if we have insights)
  if (insights.length > 0) {
    const rows = insights.map(insight => ({
      space_id: spaceId,
      user_id: currentUserId,
      suggestion_type: insight.type === 'prediction' ? 'new_task' : 'reminder',
      title: insight.title,
      reason: insight.description,
      confidence_score: insight.confidence,
      status: 'pending'
    }));

    await supabase.from('task_suggestions').insert(rows);
  }

  return insights;
}

/**
 * Analyze task history to find patterns and predict needs
 */
export async function analyzeSpaceIntelligence(
  supabase: SupabaseClient,
  spaceId: string
): Promise<IntelligenceInsight[]> {
  const insights: IntelligenceInsight[] = [];

  // 1. Fetch necessary data
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });

  const { data: members } = await supabase
    .from('space_members')
    .select('*, profile:profiles(*)')
    .eq('space_id', spaceId);

  if (!tasks || !members) return [];

  // 2. Analyze Task Frequency (Prediction)
  const categoryFrequency = analyzeCategoryFrequency(tasks);
  
  for (const [category, freq] of Object.entries(categoryFrequency)) {
    const lastTask = tasks.find(t => t.category === category && t.status === 'done');
    if (lastTask) {
      const daysSince = (Date.now() - new Date(lastTask.created_at).getTime()) / (1000 * 60 * 60 * 24);
      
      // If it's been longer than usual + 20% buffer
      if (daysSince > freq.avgDays * 1.2) {
        insights.push({
          type: 'prediction',
          title: `${TASK_CATEGORIES[category as TaskCategory].label} might be needed`,
          description: `Usually done every ${Math.round(freq.avgDays)} days. Last done ${Math.round(daysSince)} days ago.`,
          confidence: 0.8,
          action: 'create_task',
          metadata: { category }
        });
      }
    }
  }

  // 3. Analyze Member Performance (Slacking/Overworking)
  const memberStats = calculateMemberStats(tasks, members);
  const avgPoints = memberStats.reduce((sum, m) => sum + m.total_points, 0) / memberStats.length;

  for (const stat of memberStats) {
    const member = members.find(m => m.user_id === stat.user_id);
    if (!member) continue;

    // Slacking detection
    if (stat.total_points < avgPoints * 0.7) {
      insights.push({
        type: 'anomaly',
        title: `${member.profile?.username || 'Member'} is falling behind`,
        description: `Points are significantly below average (${stat.total_points} vs ${Math.round(avgPoints)}).`,
        confidence: 0.9,
        relatedUserId: stat.user_id,
        action: 'remind_user'
      });
    }

    // Inactivity detection
    if (stat.last_task_date) {
      const daysInactive = (Date.now() - new Date(stat.last_task_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysInactive > 7) {
        insights.push({
          type: 'suggestion',
          title: `Remind ${member.profile?.username || 'Member'} to help out`,
          description: `Hasn't completed a task in ${Math.round(daysInactive)} days.`,
          confidence: 0.7,
          relatedUserId: stat.user_id,
          action: 'remind_user'
        });
      }
    }
  }

  return insights;
}

/**
 * Helper: Calculate average days between tasks of same category
 */
function analyzeCategoryFrequency(tasks: Task[]) {
  const frequency: Record<string, { gaps: number[], avgDays: number }> = {};
  
  // Group by category
  const byCategory: Record<string, Date[]> = {};
  tasks.forEach(t => {
    if (t.status === 'done') {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(new Date(t.created_at));
    }
  });

  // Calculate gaps
  for (const [cat, dates] of Object.entries(byCategory)) {
    if (dates.length < 2) continue;
    dates.sort((a, b) => b.getTime() - a.getTime()); // Newest first
    
    const gaps: number[] = [];
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = (dates[i].getTime() - dates[i+1].getTime()) / (1000 * 60 * 60 * 24);
      gaps.push(diff);
    }

    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    frequency[cat] = { gaps, avgDays: avg };
  }

  return frequency;
}

/**
 * Helper: Calculate basic stats for members from tasks
 */
function calculateMemberStats(tasks: Task[], members: any[]): FairnessStats[] {
  return members.map(m => {
    const userTasks = tasks.filter(t => t.assigned_to === m.user_id && t.status === 'done');
    const totalPoints = userTasks.reduce((sum, t) => sum + t.difficulty, 0);
    
    return {
      user_id: m.user_id,
      space_id: m.space_id,
      total_points: totalPoints,
      tasks_completed: userTasks.length,
      easy_tasks: userTasks.filter(t => t.difficulty <= 3).length,
      medium_tasks: userTasks.filter(t => t.difficulty > 3 && t.difficulty <= 6).length,
      hard_tasks: userTasks.filter(t => t.difficulty > 6).length,
      avg_difficulty: totalPoints / (userTasks.length || 1),
      last_task_date: userTasks.length > 0 ? userTasks[0].created_at : null
    };
  });
}

/**
 * Generate a smart reminder message
 */
export function generateReminderMessage(insight: IntelligenceInsight): string {
  if (insight.type === 'prediction') {
        return `Hey! It looks like ${insight.title}. ${insight.description} Want to create a task for it?`;
  }
  if (insight.type === 'anomaly') {
    return `${insight.title}. ${insight.description} A gentle nudge might help!`;
  }
  return insight.description;
}
