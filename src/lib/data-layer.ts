/**
 * Production-grade Data Access Layer
 * Type-safe, cached, and optimized database operations
 */

import { supabase } from './supabase';
import { dataCache, dedupeRequest, BatchLoader } from './cache';
import { monitoring } from './monitoring';
import { AppError, NotFoundError } from './error-handler';
import type { 
  Profile, Space, SpaceMember, Task, TaskCategory,
  FairnessStats, ActivityLog, Notification 
} from '@/types';

// Type-safe query builders
type OrderDirection = 'asc' | 'desc';

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  signal?: AbortSignal;
}

/**
 * Base repository with common operations
 */
abstract class BaseRepository<T extends { id: string }> {
  protected abstract tableName: string;
  protected abstract cachePrefix: string;

  /**
   * Find by ID with caching
   */
  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    const cacheKey = `${this.cachePrefix}:${id}`;
    
    if (options.cache !== false) {
      const cached = dataCache.get(cacheKey) as T | undefined;
      if (cached) return cached;
    }

    const start = performance.now();
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    monitoring.trackApiCall(
      `db:${this.tableName}:findById`,
      'SELECT',
      performance.now() - start,
      error ? 500 : 200
    );

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AppError(error.message, 'DB_ERROR', 500);
    }

    if (data && options.cache !== false) {
      dataCache.set(cacheKey, data, options.cacheTTL);
    }

    return data as T;
  }

  /**
   * Find many with filtering
   */
  async findMany(
    filters: Partial<T>,
    options: QueryOptions & { 
      limit?: number; 
      offset?: number;
      orderBy?: keyof T;
      orderDir?: OrderDirection;
    } = {}
  ): Promise<T[]> {
    const start = performance.now();
    let query = supabase.from(this.tableName).select('*');

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy as string, { 
        ascending: options.orderDir !== 'desc' 
      });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
    }

    const { data, error } = await query;

    monitoring.trackApiCall(
      `db:${this.tableName}:findMany`,
      'SELECT',
      performance.now() - start,
      error ? 500 : 200
    );

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return (data ?? []) as T[];
  }

  /**
   * Create new record
   */
  async create(data: Omit<T, 'id' | 'created_at'>): Promise<T> {
    const start = performance.now();
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    monitoring.trackApiCall(
      `db:${this.tableName}:create`,
      'INSERT',
      performance.now() - start,
      error ? 500 : 201
    );

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return result as T;
  }

  /**
   * Update record
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const start = performance.now();
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    monitoring.trackApiCall(
      `db:${this.tableName}:update`,
      'UPDATE',
      performance.now() - start,
      error ? 500 : 200
    );

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    
    // Invalidate cache
    dataCache.delete(`${this.cachePrefix}:${id}`);
    
    return result as T;
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    const start = performance.now();
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    monitoring.trackApiCall(
      `db:${this.tableName}:delete`,
      'DELETE',
      performance.now() - start,
      error ? 500 : 204
    );

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    
    // Invalidate cache
    dataCache.delete(`${this.cachePrefix}:${id}`);
  }

  /**
   * Invalidate cache for entity
   */
  invalidateCache(id?: string): void {
    if (id) {
      dataCache.delete(`${this.cachePrefix}:${id}`);
    } else {
      dataCache.deletePattern(new RegExp(`^${this.cachePrefix}:`));
    }
  }
}

/**
 * Profile Repository
 */
class ProfileRepository extends BaseRepository<Profile> {
  protected tableName = 'profiles';
  protected cachePrefix = 'profile';

  private batchLoader = new BatchLoader<string, Profile>(
    async (ids) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);
      
      const map = new Map<string, Profile>();
      data?.forEach(profile => map.set(profile.id, profile));
      return map;
    }
  );

  /**
   * Batch load profiles (efficient for lists)
   */
  async loadBatch(ids: string[]): Promise<Profile[]> {
    const results = await Promise.all(ids.map(id => this.batchLoader.load(id)));
    return results;
  }

  /**
   * Find by username
   */
  async findByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Profile['notification_preferences']
  ): Promise<void> {
    await this.update(userId, { notification_preferences: preferences } as Partial<Profile>);
  }
}

/**
 * Space Repository
 */
class SpaceRepository extends BaseRepository<Space> {
  protected tableName = 'spaces';
  protected cachePrefix = 'space';

  /**
   * Find by invite code
   */
  async findByInviteCode(code: string): Promise<Space | null> {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('invite_code', code)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data;
  }

  /**
   * Get spaces for user
   */
  async getForUser(userId: string): Promise<Space[]> {
    const cacheKey = `spaces:user:${userId}`;
    
    return dedupeRequest(cacheKey, async () => {
      const { data, error } = await supabase
        .from('space_members')
        .select('spaces(*)')
        .eq('user_id', userId);

      if (error) throw new AppError(error.message, 'DB_ERROR', 500);
      return data?.map(d => d.spaces).filter(Boolean) as Space[] ?? [];
    });
  }

  /**
   * Get space with members
   */
  async getWithMembers(spaceId: string): Promise<Space & { members: (SpaceMember & { profile: Profile })[] }> {
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (spaceError) throw new AppError(spaceError.message, 'DB_ERROR', 500);
    if (!space) throw new NotFoundError('Space');

    const { data: members, error: membersError } = await supabase
      .from('space_members')
      .select('*, profile:profiles(*)')
      .eq('space_id', spaceId);

    if (membersError) throw new AppError(membersError.message, 'DB_ERROR', 500);

    return {
      ...space,
      members: members as (SpaceMember & { profile: Profile })[],
    };
  }

  /**
   * Regenerate invite code
   */
  async regenerateInviteCode(spaceId: string): Promise<string> {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase
      .from('spaces')
      .update({ invite_code: newCode })
      .eq('id', spaceId);

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    
    this.invalidateCache(spaceId);
    return newCode;
  }
}

/**
 * Task Repository
 */
class TaskRepository extends BaseRepository<Task> {
  protected tableName = 'tasks';
  protected cachePrefix = 'task';

  /**
   * Get tasks for space with relations
   */
  async getForSpace(
    spaceId: string,
    options: {
      status?: Task['status'][];
      assignedTo?: string;
      category?: TaskCategory;
      limit?: number;
      orderBy?: 'due_date' | 'created_at' | 'difficulty';
      orderDir?: OrderDirection;
    } = {}
  ): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*),
        creator:profiles!tasks_created_by_fkey(*)
      `)
      .eq('space_id', spaceId);

    if (options.status?.length) {
      query = query.in('status', options.status);
    }
    if (options.assignedTo) {
      query = query.eq('assigned_to', options.assignedTo);
    }
    if (options.category) {
      query = query.eq('category', options.category);
    }
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.orderDir !== 'desc',
        nullsFirst: false 
      });
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data as Task[];
  }

  /**
   * Take a task
   */
  async take(taskId: string, userId: string): Promise<Task> {
    // Use RPC for atomic operation with business logic
    const { data, error } = await supabase.rpc('take_task', { task_id: taskId });
    
    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    
    this.invalidateCache(taskId);
    return data;
  }

  /**
   * Submit proof and complete
   */
  async submitProof(taskId: string, proofUrl: string): Promise<Task> {
    const { data, error } = await supabase.rpc('submit_task_proof', {
      task_id: taskId,
      proof_image_url: proofUrl,
    });

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    
    this.invalidateCache(taskId);
    return data;
  }

  /**
   * Get overdue tasks
   */
  async getOverdue(spaceId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(*)')
      .eq('space_id', spaceId)
      .in('status', ['todo', 'in_progress'])
      .lt('due_date', new Date().toISOString());

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data as Task[];
  }

  /**
   * Get task statistics for space
   */
  async getStatistics(spaceId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    avgCompletionTime: number;
  }> {
    const now = new Date().toISOString();
    
    const [totalResult, completedResult, pendingResult, overdueResult] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('space_id', spaceId),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('space_id', spaceId).eq('status', 'done'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('space_id', spaceId).in('status', ['todo', 'in_progress']),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('space_id', spaceId).in('status', ['todo', 'in_progress']).lt('due_date', now),
    ]);

    return {
      total: totalResult.count ?? 0,
      completed: completedResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      overdue: overdueResult.count ?? 0,
      avgCompletionTime: 0, // Would require more complex query
    };
  }
}

/**
 * Space Member Repository
 */
class SpaceMemberRepository {
  /**
   * Get member with profile
   */
  async get(spaceId: string, userId: string): Promise<SpaceMember & { profile: Profile } | null> {
    const { data, error } = await supabase
      .from('space_members')
      .select('*, profile:profiles(*)')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data as SpaceMember & { profile: Profile };
  }

  /**
   * Add member to space
   */
  async add(spaceId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<SpaceMember> {
    const { data, error } = await supabase
      .from('space_members')
      .insert({ space_id: spaceId, user_id: userId, role, points: 0 })
      .select()
      .single();

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data;
  }

  /**
   * Update member points
   */
  async updatePoints(spaceId: string, userId: string, pointsDelta: number): Promise<void> {
    const { error } = await supabase.rpc('update_member_points', {
      p_space_id: spaceId,
      p_user_id: userId,
      p_points_delta: pointsDelta,
    });

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(spaceId: string, limit: number = 10): Promise<(SpaceMember & { profile: Profile })[]> {
    const { data, error } = await supabase
      .from('space_members')
      .select('*, profile:profiles(*)')
      .eq('space_id', spaceId)
      .order('points', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data as (SpaceMember & { profile: Profile })[];
  }

  /**
   * Get fairness statistics for all members
   */
  async getFairnessStats(spaceId: string): Promise<FairnessStats[]> {
    // This would use a view or function in production
    const { data, error } = await supabase.rpc('get_fairness_stats', {
      p_space_id: spaceId,
    });

    if (error) {
      // Fallback to basic calculation if RPC not available
      const { data: members } = await supabase
        .from('space_members')
        .select('user_id, points')
        .eq('space_id', spaceId);

      return members?.map(m => ({
        user_id: m.user_id,
        space_id: spaceId,
        total_points: m.points,
        tasks_completed: 0,
        easy_tasks: 0,
        medium_tasks: 0,
        hard_tasks: 0,
        avg_difficulty: 0,
        last_task_date: null,
      })) ?? [];
    }

    return data;
  }
}

/**
 * Activity Log Repository
 */
class ActivityRepository {
  /**
   * Log activity
   */
  async log(
    spaceId: string,
    userId: string,
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await supabase.from('activity_log').insert({
      space_id: spaceId,
      user_id: userId,
      action,
      details,
    });
  }

  /**
   * Get recent activity
   */
  async getRecent(spaceId: string, limit: number = 20): Promise<(ActivityLog & { profile: Profile })[]> {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*, profile:profiles(*)')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data as (ActivityLog & { profile: Profile })[];
  }
}

// Export singleton instances
export const profileRepository = new ProfileRepository();
export const spaceRepository = new SpaceRepository();
export const taskRepository = new TaskRepository();
export const spaceMemberRepository = new SpaceMemberRepository();
export const activityRepository = new ActivityRepository();

// Export for custom queries
export { supabase };
