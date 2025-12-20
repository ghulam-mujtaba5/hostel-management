import { Task, FairnessStats, TaskRecommendation, TaskCategory } from '@/types';

interface UserTaskHistory {
  userId: string;
  recentTasks: Task[];
  stats: FairnessStats;
  preferences?: {
    preferred_categories: TaskCategory[];
    avoided_categories: TaskCategory[];
  };
}

/**
 * Fairness Algorithm for Task Recommendations
 * 
 * Scoring factors:
 * 1. Workload Balance: Users with fewer points get priority
 * 2. Category Diversity: Avoid assigning same category repeatedly
 * 3. Difficulty Balance: Ensure fair distribution of hard/easy tasks
 * 4. Preference Match: Boost score for preferred categories
 * 5. Recency: Avoid assigning to users who just completed a task
 */
export function calculateTaskRecommendations(
  availableTasks: Task[],
  userHistory: UserTaskHistory,
  allMembersStats: FairnessStats[]
): TaskRecommendation[] {
  const recommendations: TaskRecommendation[] = [];
  
  // Calculate average points across all members
  const avgPoints = allMembersStats.reduce((sum, s) => sum + s.total_points, 0) / allMembersStats.length || 0;
  
  // User's deficit (how much they're behind the average)
  const pointsDeficit = avgPoints - userHistory.stats.total_points;
  
  // Get user's recent task categories
  const recentCategories = userHistory.recentTasks
    .slice(0, 5)
    .map(t => t.category);
  
  for (const task of availableTasks) {
    let score = 50; // Base score
    const reasons: string[] = [];
    
    // 1. Workload Balance (±20 points)
    if (pointsDeficit > 0) {
      score += Math.min(20, pointsDeficit / 2);
      reasons.push("You're below average on points");
    } else if (pointsDeficit < -10) {
      score -= 10;
      reasons.push("You're ahead on points - others may need this");
    }
    
    // 2. Category Diversity (±15 points)
    const categoryCount = recentCategories.filter(c => c === task.category).length;
    if (categoryCount === 0) {
      score += 15;
      reasons.push(`You haven't done ${task.category} recently`);
    } else if (categoryCount >= 2) {
      score -= 10;
      reasons.push(`You've done ${task.category} often recently`);
    }
    
    // 3. Difficulty Balance (±15 points)
    const userDifficultyRatio = userHistory.stats.hard_tasks / (userHistory.stats.tasks_completed || 1);
    const taskIsHard = task.difficulty >= 7;
    const taskIsEasy = task.difficulty <= 3;
    
    if (taskIsHard && userDifficultyRatio < 0.3) {
      score += 15;
      reasons.push("Taking this hard task will balance your workload");
    } else if (taskIsEasy && userHistory.stats.easy_tasks > userHistory.stats.hard_tasks * 2) {
      score -= 15;
      reasons.push("You've been taking mostly easy tasks");
    }
    
    // 4. Preference Match (±10 points)
    if (userHistory.preferences) {
      if (userHistory.preferences.preferred_categories.includes(task.category)) {
        score += 10;
        reasons.push("Matches your preferences");
      }
      if (userHistory.preferences.avoided_categories.includes(task.category)) {
        score -= 20;
        reasons.push("You've marked this as avoided");
      }
    }
    
    // 5. Due Date Urgency (+10 points for urgent)
    if (task.due_date) {
      const hoursUntilDue = (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDue < 24) {
        score += 10;
        reasons.push("Due soon!");
      }
    }
    
    // 6. Points reward visibility
    reasons.push(`+${task.difficulty} points`);
    
    recommendations.push({
      task,
      score: Math.max(0, Math.min(100, score)),
      reason: reasons[0] || "Available for you",
    });
  }
  
  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Calculate fairness score for a user
 * Returns a value 0-100 where 100 is perfectly fair
 */
export function calculateFairnessScore(
  userStats: FairnessStats,
  allMembersStats: FairnessStats[]
): number {
  if (allMembersStats.length <= 1) return 100;
  
  const avgPoints = allMembersStats.reduce((sum, s) => sum + s.total_points, 0) / allMembersStats.length;
  const avgDifficulty = allMembersStats.reduce((sum, s) => sum + s.avg_difficulty, 0) / allMembersStats.length;
  
  // Points deviation penalty
  const pointsDeviation = Math.abs(userStats.total_points - avgPoints) / (avgPoints || 1);
  const pointsScore = Math.max(0, 100 - pointsDeviation * 50);
  
  // Difficulty balance penalty
  const difficultyDeviation = Math.abs(userStats.avg_difficulty - avgDifficulty) / (avgDifficulty || 1);
  const difficultyScore = Math.max(0, 100 - difficultyDeviation * 50);
  
  // Weighted average
  return Math.round((pointsScore * 0.6 + difficultyScore * 0.4));
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Auto-assign tasks fairly across members
 */
export function autoAssignTasks(
  tasks: Task[],
  membersStats: FairnessStats[]
): Map<string, string> {
  const assignments = new Map<string, string>();
  
  // Sort members by points (ascending - lowest first)
  const sortedMembers = [...membersStats].sort((a, b) => a.total_points - b.total_points);
  
  // Sort tasks by difficulty (descending - hardest first)
  const sortedTasks = [...tasks].sort((a, b) => b.difficulty - a.difficulty);
  
  let memberIndex = 0;
  
  for (const task of sortedTasks) {
    // Assign to member with lowest points
    const member = sortedMembers[memberIndex];
    assignments.set(task.id, member.user_id);
    
    // Round-robin to next member
    memberIndex = (memberIndex + 1) % sortedMembers.length;
  }
  
  return assignments;
}
