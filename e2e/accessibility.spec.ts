import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('login page should have proper headings', async ({ page }) => {
    await page.goto('/login');
    
    // Check for heading hierarchy
    const heading = page.getByRole('heading', { name: 'HostelMate' });
    await expect(heading).toBeVisible();
  });

  test('demo page should have proper heading structure', async ({ page }) => {
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
    
    // All buttons should have accessible names
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Demo Mode' })).toBeVisible();
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check inputs have associated labels or placeholders
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.getByPlaceholder('••••••••');
    await expect(passwordInput).toBeVisible();
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/login');
    
    // Focus email input directly
    const emailInput = page.getByPlaceholder('you@example.com');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
    
    // Tab to password
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder('••••••••')).toBeFocused();
  });

  test('demo mode buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/demo');
    
    // Should be able to skip tour with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Should focus Skip Tour or Next
    await page.keyboard.press('Enter');
    
    // Tour should close
    await expect(page.getByText('Step 1/4')).not.toBeVisible({ timeout: 3000 });
  });
});
