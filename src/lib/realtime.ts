/**
 * Real-time updates system using Supabase subscriptions
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionCallback<T> = (payload: T) => void;
type UnsubscribeFn = () => void;

interface RealtimeEvent<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old?: T;
}

/**
 * Real-time subscription manager
 */
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, SubscriptionCallback<any>[]> = new Map();

  /**
   * Subscribe to table changes
   */
  subscribeToTable<T>(
    tableName: string,
    callback: SubscriptionCallback<RealtimeEvent<T>>,
    filter?: string
  ): UnsubscribeFn {
    const key = `${tableName}:${filter || '*'}`;

    // Create channel if not exists
    if (!this.channels.has(key)) {
      let channel = supabase
        .channel(`public:${tableName}`, {
          config: { broadcast: { ack: true } },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            ...(filter && { filter }),
          },
          (payload: any) => {
            this.notifySubscribers(key, {
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          }
        )
        .subscribe();

      this.channels.set(key, channel);
    }

    // Add callback to subscribers
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }

        // Unsubscribe channel if no more subscribers
        if (callbacks.length === 0) {
          const channel = this.channels.get(key);
          if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(key);
            this.subscriptions.delete(key);
          }
        }
      }
    };
  }

  /**
   * Subscribe to specific record
   */
  subscribeToRecord<T>(
    tableName: string,
    id: string,
    callback: SubscriptionCallback<RealtimeEvent<T>>
  ): UnsubscribeFn {
    return this.subscribeToTable<T>(
      tableName,
      callback,
      `id=eq.${id}`
    );
  }

  /**
   * Subscribe to space changes
   */
  subscribeToSpace(
    spaceId: string,
    callback: SubscriptionCallback<any>
  ): UnsubscribeFn {
    const unsubscribeFns: UnsubscribeFn[] = [];

    // Subscribe to space members
    unsubscribeFns.push(
      this.subscribeToTable(
        'space_members',
        callback,
        `space_id=eq.${spaceId}`
      )
    );

    // Subscribe to tasks
    unsubscribeFns.push(
      this.subscribeToTable(
        'tasks',
        callback,
        `space_id=eq.${spaceId}`
      )
    );

    // Subscribe to activity log
    unsubscribeFns.push(
      this.subscribeToTable(
        'activity_log',
        callback,
        `space_id=eq.${spaceId}`
      )
    );

    return () => {
      unsubscribeFns.forEach(fn => fn());
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(key: string, event: any) {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in real-time callback:', error);
        }
      });
    }
  }

  /**
   * Clean up all subscriptions
   */
  unsubscribeAll() {
    for (const [, channel] of this.channels) {
      supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.subscriptions.clear();
  }
}

/**
 * Singleton instance
 */
export const realtimeManager = new RealtimeManager();

/**
 * Hook for real-time updates (to be used in React components)
 */
import { useEffect, useState } from 'react';

export function useRealtimeSubscription<T>(
  tableName: string,
  callback: SubscriptionCallback<RealtimeEvent<T>>,
  filter?: string
) {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToTable<T>(
      tableName,
      callback,
      filter
    );

    return () => {
      unsubscribe();
    };
  }, [tableName, filter]);
}

export function useRealtimeRecord<T>(
  tableName: string,
  id: string,
  callback: SubscriptionCallback<RealtimeEvent<T>>
) {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToRecord<T>(
      tableName,
      id,
      callback
    );

    return () => {
      unsubscribe();
    };
  }, [tableName, id]);
}

export function useRealtimeSpace(
  spaceId: string,
  callback: SubscriptionCallback<any>
) {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToSpace(spaceId, callback);

    return () => {
      unsubscribe();
    };
  }, [spaceId]);
}
