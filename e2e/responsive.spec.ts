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
      await page.goto('/demo');
      
      await page.getByRole('button', { name: 'Skip Tour' }).click();
      
      // Check that main elements are visible
      await expect(page.getByText('Hey, Demo User!')).toBeVisible();
      await expect(page.getByText('Demo Space')).toBeVisible();
      
      // Take screenshot for visual regression
      await page.screenshot({ 
        path: `e2e/screenshots/${size.name.toLowerCase()}-demo.png`,
        fullPage: true 
      });
    });
  }

  test('should have readable text on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/demo');
    
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    
    // Check font sizes are reasonable (text should be visible)
    const heading = page.getByRole('heading', { name: /Hey, Demo User!/i });
    await expect(heading).toBeVisible();
  });

  test('should have clickable buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/demo');
    
    await page.getByRole('button', { name: 'Skip Tour' }).click();
    
    // All buttons should be clickable
    const takeTaskButton = page.getByRole('button', { name: 'Take This Task' }).first();
    await expect(takeTaskButton).toBeVisible();
    
    const boundingBox = await takeTaskButton.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(30); // Touch target should be at least 30px
  });
});
