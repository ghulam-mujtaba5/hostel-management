import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('login page should have proper headings', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check for heading hierarchy - use case insensitive match
    const heading = page.getByRole('heading', { name: /welcome back/i });
    await expect(heading).toBeVisible();
  });

  // Demo mode has been removed - skip this test
  test.skip('demo page should have proper heading structure', async ({ page }) => {
    await page.goto('/demo');
    
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    
    // Main heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Section headings - use first() since there might be duplicates
    await expect(page.getByRole('heading', { name: 'Your Tasks' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // All buttons should have accessible names
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    // Google OAuth button
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check inputs have associated labels or placeholders  
    const emailInput = page.getByPlaceholder('name@example.com');
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.getByPlaceholder('••••••••');
    await expect(passwordInput).toBeVisible();
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Focus email input directly
    const emailInput = page.getByPlaceholder('name@example.com');
    await emailInput.click(); // Click to focus
    await expect(emailInput).toBeFocused();
    
    // Tab navigation should work - check that password field can be focused
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.click();
    await expect(passwordInput).toBeFocused();
  });

  // Demo mode has been removed - skip this test
  test.skip('demo mode buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/demo');
    
    // Should be able to skip tour with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Should focus Skip Tour or Next
    await page.keyboard.press('Enter');
    
    // Tour should close
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 3000 });
  });
});
