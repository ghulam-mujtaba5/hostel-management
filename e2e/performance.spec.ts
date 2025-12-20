import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('login page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('demo page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('page should be interactive quickly', async ({ page }) => {
    await page.goto('/demo');
    
    // Time to interactive - button should be clickable quickly
    const startTime = Date.now();
    const skipButton = page.getByRole('button', { name: 'Skip Tour' });
    await skipButton.waitFor({ state: 'visible' });
    await expect(skipButton).toBeEnabled();
    
    const timeToInteractive = Date.now() - startTime;
    
    // Should be interactive in under 3 seconds
    expect(timeToInteractive).toBeLessThan(3000);
  });

  test('no console errors on login page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Filter out known/acceptable errors (like missing icons)
    const criticalErrors = errors.filter(err => 
      !err.includes('404') && 
      !err.includes('icon') &&
      !err.includes('manifest')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('no console errors on demo page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(err => 
      !err.includes('404') && 
      !err.includes('icon') &&
      !err.includes('manifest')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
