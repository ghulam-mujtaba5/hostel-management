// Database types
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  created_at: string;
}

export interface Space {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface SpaceProfile {
  id: string;
  space_id: string;
  description: string | null;
  address: string | null;
  rules: string | null;
  announcement: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  space_id: string;
  user_id: string;
  role: 'admin' | 'member';
  points: number;
  joined_at: string;
  // Accommodation fields (added in supabase migration 20251221000000_accommodation_system.sql)
  room_number?: string | null;
  bed_number?: string | null;
  status?: 'active' | 'inactive' | 'pending' | (string & {});
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  space_id: string | null;
  type: 'task_assigned' | 'task_completed' | 'cleaning_request' | 'token_used' | 'member_joined' | 'announcement';
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface TaskToken {
  id: string;
  user_id: string;
  space_id: string;
  tokens_used: number;
  max_tokens: number;
  period_start: string;
  period_type: 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

export interface TaskRequest {
  id: string;
  space_id: string;
  requester_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  proof_image_url: string | null;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  token_cost: number;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  assignee?: Profile;
}

export interface ServiceQueue {
  id: string;
  space_id: string;
  user_id: string;
  service_type: string;
  description: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  queue_position: number;
  original_position: number;
  priority_skips_used: number;
  priority_skips_available: number;
  status: 'queued' | 'in_service' | 'completed' | 'cancelled';
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  estimated_wait_minutes: number | null;
  actual_wait_minutes: number | null;
  is_hostel_member: boolean;
  membership_tier: 'standard' | 'premium' | 'vip';
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface QueuePriorityHistory {
  id: string;
  queue_entry_id: string;
  user_id: string;
  space_id: string;
  skip_count: number;
  reason: 'urgency' | 'membership_priority' | 'available_skip';
  previous_position: number;
  new_position: number;
  skipped_at: string;
}

export interface QueueSettings {
  id: string;
  space_id: string;
  max_priority_skips_per_member: number;
  priority_skip_reset_period: 'weekly' | 'monthly' | 'never';
  avg_service_time_minutes: number;
  max_concurrent_services: number;
  enable_membership_priority: boolean;
  enable_urgency_priority: boolean;
  enable_time_based_priority: boolean;
  max_wait_before_boost_minutes: number;
  prevent_skip_abuse: boolean;
  min_time_between_skips_hours: number;
  created_at: string;
  updated_at: string;
}

export interface QueueStatus {
  total_queued: number;
  in_service: number;
  avg_wait_minutes: number;
  max_concurrent: number;
  spots_available: number;
}

export interface TaskSettings {
  id: string;
  space_id: string;
  rotation_enabled: boolean;
  rotation_type: 'round_robin' | 'random' | 'weighted';
  auto_assign_enabled: boolean;
  max_requests_per_period: number;
  request_period: 'weekly' | 'monthly';
  notification_before_due: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  difficulty: number; // 1-10
  status: 'todo' | 'in_progress' | 'pending_verification' | 'done';
  assigned_to: string | null;
  due_date: string | null;
  proof_image_url: string | null;
  created_by: string | null;
  created_at: string;
  category: TaskCategory;
  assignee?: Profile;
}

export type TaskCategory = 
  | 'washroom'
  | 'sweeping'
  | 'kitchen'
  | 'trash'
  | 'dusting'
  | 'laundry'
  | 'dishes'
  | 'other';

export interface TaskTemplate {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  difficulty: number;
  category: TaskCategory;
  is_recurring: boolean;
  recurrence_days: number | null; // Every X days
}

export interface ActivityLog {
  id: string;
  space_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  profile?: Profile;
}

export interface UserPreferences {
  user_id: string;
  space_id: string;
  preferred_categories: TaskCategory[];
  avoided_categories: TaskCategory[];
  max_weekly_tasks: number | null;
  availability: WeeklyAvailability;
}

export interface WeeklyAvailability {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface FairnessStats {
  user_id: string;
  space_id: string;
  total_points: number;
  tasks_completed: number;
  easy_tasks: number; // difficulty 1-3
  medium_tasks: number; // difficulty 4-6
  hard_tasks: number; // difficulty 7-10
  avg_difficulty: number;
  last_task_date: string | null;
}

// UI Types
export interface TaskRecommendation {
  task: Task;
  score: number;
  reason: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  tasks_completed: number;
  rank: number;
}

// Feedback System Types
export type FeedbackType = 'issue' | 'feature';
export type FeedbackStatus = 'pending' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Feedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  created_at: string;
  updated_at: string;
  vote_count?: number;
  user_vote?: boolean;
  profile?: Profile;
}

export interface FeedbackVote {
  id: string;
  feedback_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedbackComment {
  id: string;
  feedback_id: string;
  user_id: string;
  comment: string;
  is_admin_response: boolean;
  created_at: string;
  profile?: Profile;
}

export interface FeedbackWithDetails extends Feedback {
  comments: FeedbackComment[];
}

// Category metadata
export const TASK_CATEGORIES: Record<TaskCategory, { label: string; emoji: string; color: string }> = {
  washroom: { label: 'Washroom', emoji: '🚽', color: 'bg-blue-100 text-blue-800' },
  sweeping: { label: 'Sweeping', emoji: '🧹', color: 'bg-yellow-100 text-yellow-800' },
  kitchen: { label: 'Kitchen', emoji: '🍳', color: 'bg-orange-100 text-orange-800' },
  trash: { label: 'Trash', emoji: '🗑️', color: 'bg-gray-100 text-gray-800' },
  dusting: { label: 'Dusting', emoji: '✨', color: 'bg-purple-100 text-purple-800' },
  laundry: { label: 'Laundry', emoji: '👕', color: 'bg-pink-100 text-pink-800' },
  dishes: { label: 'Dishes', emoji: '🍽️', color: 'bg-cyan-100 text-cyan-800' },
  other: { label: 'Other', emoji: '📋', color: 'bg-slate-100 text-slate-800' },
};

// Difficulty helpers
export const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 3) return 'Easy';
  if (difficulty <= 6) return 'Medium';
  return 'Hard';
};

export const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 3) return 'bg-green-100 text-green-800';
  if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};
