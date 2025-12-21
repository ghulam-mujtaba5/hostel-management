/**
 * Advanced search and filtering system
 */

import { Task } from '@/types';

export interface SearchFilter {
  query?: string;
  difficulty?: string[];
  status?: string[];
  priority?: string[];
  dateRange?: { start: Date; end: Date };
  assignedTo?: string;
  tags?: string[];
  sortBy?: 'date' | 'points' | 'title' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Search and filter manager
 */
export class SearchManager {
  /**
   * Search tasks
   */
  static searchTasks(tasks: Task[], filter: SearchFilter): SearchResult<Task> {
    let filtered = [...tasks];

    // Text search
    if (filter.query) {
      const query = filter.query.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          (task.description?.toLowerCase().includes(query) ?? false)
      );
    }

    // Note: Difficulty filtering disabled - difficulty is numeric (1-10 points)
    // but filter options expect string labels. Would need to convert properly.

    // Filter by status
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(task =>
        filter.status!.includes(task.status)
      );
    }

    // Note: Priority filtering disabled - Task type doesn't have a priority field
    // This feature was not implemented in the database schema

    // Filter by date range
    if (filter.dateRange) {
      filtered = filtered.filter(task => {
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        return (
          dueDate &&
          dueDate >= filter.dateRange!.start &&
          dueDate <= filter.dateRange!.end
        );
      });
    }

    // Filter by assigned user
    if (filter.assignedTo) {
      filtered = filtered.filter(task => task.assigned_to === filter.assignedTo);
    }

    // Sort
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (filter.sortBy) {
          case 'date':
            aVal = a.due_date ? new Date(a.due_date).getTime() : Infinity;
            bVal = b.due_date ? new Date(b.due_date).getTime() : Infinity;
            break;
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'difficulty':
            // Difficulty is a number (1-10)
            aVal = a.difficulty || 0;
            bVal = b.difficulty || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return filter.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return filter.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
      hasMore: false,
    };
  }

  /**
   * Paginate results
   */
  static paginate<T>(
    items: T[],
    page: number = 1,
    pageSize: number = 20
  ): SearchResult<T> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedItems = items.slice(start, end);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      pageSize,
      hasMore: end < items.length,
    };
  }

  /**
   * Fuzzy search
   */
  static fuzzySearch<T extends { title?: string; name?: string }>(
    items: T[],
    query: string,
    searchField: keyof T = 'title' as keyof T
  ): T[] {
    if (!query) return items;

    const queryLower = query.toLowerCase();
    const queryChars = queryLower.split('');

    return items.filter(item => {
      const text = (item[searchField] as any)?.toLowerCase() || '';
      let charIndex = 0;

      for (let i = 0; i < text.length && charIndex < queryChars.length; i++) {
        if (text[i] === queryChars[charIndex]) {
          charIndex++;
        }
      }

      return charIndex === queryChars.length;
    });
  }

  /**
   * Highlight search results
   */
  static highlightResults(
    text: string,
    query: string,
    className: string = 'bg-yellow-200'
  ): string {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, `<mark class="${className}">$1</mark>`);
  }

  /**
   * Get filter suggestions
   * Note: Disabled - references non-existent fields
   */
  static getFilterSuggestions(
    items: Task[],
    filterType: 'difficulty' | 'status' | 'priority'
  ): string[] {
    // Filter suggestions disabled - priority and difficulty fields don't exist on Task
    return [];
  }

  /**
   * Get search history from localStorage
   */
  static getSearchHistory(key: string = 'search_history'): string[] {
    if (typeof window === 'undefined') return [];

    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  }

  /**
   * Add to search history
   */
  static addToSearchHistory(query: string, key: string = 'search_history') {
    if (typeof window === 'undefined' || !query) return;

    const history = this.getSearchHistory(key);
    const filtered = history.filter(h => h !== query);
    const updated = [query, ...filtered].slice(0, 10); // Keep last 10

    localStorage.setItem(key, JSON.stringify(updated));
  }

  /**
   * Clear search history
   */
  static clearSearchHistory(key: string = 'search_history') {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(key);
  }
}

/**
 * React hook for search
 */
import { useState, useCallback, useEffect } from 'react';

export function useSearch<T extends { title?: string }>(items: T[]) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>(items);
  const [history, setHistory] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    setHistory(SearchManager.getSearchHistory());
  }, []);

  // Update results when query changes
  useEffect(() => {
    if (!query) {
      setResults(items);
    } else {
      const filtered = SearchManager.fuzzySearch(items, query);
      setResults(filtered);
      SearchManager.addToSearchHistory(query);
    }
  }, [query, items]);

  const clearHistory = useCallback(() => {
    SearchManager.clearSearchHistory();
    setHistory([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    history,
    clearHistory,
  };
}
