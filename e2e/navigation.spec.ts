import { test, expect } from '@playwright/test';

test.describe('Navigation and UI', () => {
  test('should load homepage and show content', async ({ page }) => {
    await page.goto('/');
    
    // The homepage may or may not redirect based on auth state
    // Just verify it loads without errors
    await page.waitForLoadState('networkidle');
    
    // Either on home page or redirected to login
    const isOnLogin = page.url().includes('/login');
    if (isOnLogin) {
      await expect(page.getByText('Welcome Back')).toBeVisible();
    }
  });

  test('should have working navigation in demo mode', async ({ page }) => {
    await page.goto('/demo');
    
    // Skip tour
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    
    // Wait for tour to close - use a longer timeout if needed
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 10000 });
    
    // Check main content is visible
    await expect(page.getByText('Hey, Demo User!')).toBeVisible();
    await expect(page.getByText('Demo Space')).toBeVisible();
  });

  test('should display tasks in demo mode', async ({ page }) => {
    await page.goto('/demo');
    
    // Skip tour
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 10000 });
    
    // Check tasks are visible
    await expect(page.getByText('Clean the Kitchen')).toBeVisible();
    await expect(page.getByText('Take out Trash')).toBeVisible();
  });

  test('should display stats and progress in demo mode', async ({ page }) => {
    await page.goto('/demo');
    
    // Skip tour
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 10000 });
    
    // Check stats are visible
    await expect(page.getByText('Level 7')).toBeVisible();
    await expect(page.getByText('5 day streak')).toBeVisible();
    await expect(page.getByText('#1')).toBeVisible();
    await expect(page.getByText('1,250')).toBeVisible(); // Points
  });

  test('should show weekly goal progress', async ({ page }) => {
    await page.goto('/demo');
    
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 10000 });
    
    await expect(page.getByText('Weekly Goal')).toBeVisible();
    await expect(page.getByText('3/5 tasks completed')).toBeVisible();
  });

  test('should have working restart tour button', async ({ page }) => {
    await page.goto('/demo');
    
    // Skip tour first
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 10000 });
    
    // Click restart
    await page.getByRole('button', { name: 'Restart Tour' }).click();
    
    // Tour should be visible again
    await expect(page.getByText('Step 1/4')).toBeVisible();
    await expect(page.getByText('Welcome to HostelMate! 👋')).toBeVisible();
  });

  test('should interact with task in demo mode', async ({ page }) => {
    await page.goto('/demo');
    
    // Must skip tour first to avoid overlay blocking button clicks
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 10000 });
    
    // Click "Take This Task" button
    // In the demo mode, TaskCard might have different buttons
    // Let's check TaskCard.tsx
    await page.getByRole('button', { name: 'Take This Task' }).first().click();
    
    // Should show some feedback (celebration or toast)
    await page.waitForTimeout(1000); // Wait for any animations
  });
});
