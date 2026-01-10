import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  const sizes = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const size of sizes) {
    test(`should render correctly on ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Check that main elements are visible on login page
      await expect(page.getByRole('link', { name: /HostelMate/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
      
      // Take screenshot for visual regression
      await page.screenshot({ 
        path: `e2e/screenshots/${size.name.toLowerCase()}-login.png`,
        fullPage: true 
      });
    });
  }

  test('should have readable text on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check text is visible on mobile
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should have clickable buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // All buttons should be clickable
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
    
    const boundingBox = await signInButton.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(30); // Touch target should be at least 30px
  });
});
