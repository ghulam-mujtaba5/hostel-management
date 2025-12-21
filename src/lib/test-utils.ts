/**
 * Test utilities and helpers for Playwright tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Test data generators
 */
export const testData = {
  user: {
    valid: {
      email: 'test@example.com',
      password: 'TestPassword123!',
      username: 'testuser',
      fullName: 'Test User',
    },
    invalid: {
      shortPassword: '123',
      invalidEmail: 'not-an-email',
      longUsername: 'a'.repeat(50),
    },
  },

  space: {
    valid: {
      name: 'Test Hostel',
      description: 'A test hostel for unit testing',
    },
    invalid: {
      shortName: 'A',
      longName: 'A'.repeat(100),
    },
  },

  task: {
    valid: {
      title: 'Clean the kitchen',
      description: 'Deep clean the kitchen including appliances',
      difficulty: 'medium',
      points: 50,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    invalid: {
      shortTitle: 'A',
      longTitle: 'A'.repeat(200),
      negativePoints: -10,
    },
  },
};

/**
 * Common page operations
 */
export class PageHelper {
  constructor(private page: Page) {}

  /**
   * Login user
   */
  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  /**
   * Register user
   */
  async register(email: string, password: string, username: string) {
    await this.page.goto('/login?mode=signup');
    await this.page.fill('input[placeholder="Username"]', username);
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  /**
   * Create space
   */
  async createSpace(spaceName: string) {
    await this.page.goto('/spaces/create');
    await this.page.fill('input[placeholder*="Space"]', spaceName);
    await this.page.click('button:has-text("Create Space")');
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  /**
   * Create task
   */
  async createTask(title: string, description?: string) {
    await this.page.goto('/tasks/create');
    await this.page.fill('input[placeholder*="title"]', title);
    if (description) {
      await this.page.fill('textarea[placeholder*="description"]', description);
    }
    await this.page.click('button:has-text("Create")');
  }

  /**
   * Navigate to path
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    await this.page.waitForLoadState('networkidle', { timeout: 5000 });
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.isVisible(selector);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    const text = await this.page.textContent(selector);
    return text || '';
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `./test-results/${name}.png` });
  }

  /**
   * Check for errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }
}

/**
 * Assertion helpers
 */
export class AssertHelper {
  /**
   * Assert element contains text
   */
  static async hasText(page: Page, selector: string, text: string) {
    const element = page.locator(selector);
    await expect(element).toContainText(text);
  }

  /**
   * Assert element is visible
   */
  static async isVisible(page: Page, selector: string) {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
  }

  /**
   * Assert element is hidden
   */
  static async isHidden(page: Page, selector: string) {
    const element = page.locator(selector);
    await expect(element).toBeHidden();
  }

  /**
   * Assert element is disabled
   */
  static async isDisabled(page: Page, selector: string) {
    const element = page.locator(selector);
    await expect(element).toBeDisabled();
  }

  /**
   * Assert URL contains path
   */
  static async urlContains(page: Page, path: string) {
    await expect(page).toHaveURL(new RegExp(path));
  }

  /**
   * Assert element count
   */
  static async elementCount(page: Page, selector: string, count: number) {
    const elements = page.locator(selector);
    await expect(elements).toHaveCount(count);
  }

  /**
   * Assert value exists
   */
  static async hasValue(page: Page, selector: string, value: string) {
    const element = page.locator(selector);
    await expect(element).toHaveValue(value);
  }

  /**
   * Assert input has focus
   */
  static async isFocused(page: Page, selector: string) {
    const element = page.locator(selector);
    await expect(element).toBeFocused();
  }
}

/**
 * Performance testing helpers
 */
export class PerformanceHelper {
  /**
   * Measure page load time
   */
  static async measureLoadTime(page: Page): Promise<number> {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  /**
   * Check for memory leaks
   * Note: Lighthouse integration not implemented
   */
  static async checkMemory(page: Page): Promise<number> {
    const metrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    return metrics;
  }

  /**
   * Measure Core Web Vitals
   */
  static async measureWebVitals(page: Page) {
    return page.evaluate(() => {
      return {
        lcp: (performance as any).getEntriesByType?.('largest-contentful-paint')?.[0]
          ?.startTime || 0,
        fid: (performance as any).getEntriesByType?.('first-input')?.[0]?.startTime || 0,
        cls: 0, // Would require custom tracking
      };
    });
  }
}

/**
 * Accessibility testing helpers
 */
export class A11yHelper {
  /**
   * Check page accessibility
   */
  static async checkAccessibility(page: Page): Promise<string[]> {
    const violations: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('accessibility')) {
        violations.push(msg.text());
      }
    });
    return violations;
  }

  /**
   * Check ARIA labels
   */
  static async checkAriaLabels(page: Page, selector: string): Promise<boolean> {
    return page.evaluate(sel => {
      const element = document.querySelector(sel);
      return !!(element?.getAttribute('aria-label') || element?.getAttribute('aria-labelledby'));
    }, selector);
  }

  /**
   * Check keyboard navigation
   */
  static async canNavigateWithKeyboard(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector).first();
    await element.focus();
    await page.keyboard.press('Tab');
    return true; // Would need more complex checking
  }

  /**
   * Check color contrast
   */
  static async checkColorContrast(page: Page): Promise<boolean> {
    // Would require contrast checking library
    return true;
  }
}

/**
 * Mock data helpers
 */
export class MockData {
  static randomEmail(): string {
    return `test_${Date.now()}@example.com`;
  }

  static randomUsername(): string {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  static randomSpaceName(): string {
    return `space_${Math.random().toString(36).substr(2, 9)}`;
  }

  static futureDate(daysFromNow: number = 7): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }
}
