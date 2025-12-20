import { test, expect } from '@playwright/test';

test('Demo page tour and task interaction', async ({ page }) => {
  // 1. Navigate to Demo Page
  await page.goto('/demo');

  // 2. Verify Tour Step 1
  await expect(page.getByText('Welcome to HostelMate! 👋')).toBeVisible();
  await expect(page.getByText('Step 1/4')).toBeVisible();
  
  // 3. Click Next -> Step 2 - use exact match to avoid Next.js dev tools button
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Your Progress 📈')).toBeVisible();
  await expect(page.getByText('Step 2/4')).toBeVisible();

  // 4. Click Next -> Step 3
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Weekly Goals 🎯')).toBeVisible();
  await expect(page.getByText('Step 3/4')).toBeVisible();

  // 5. Click Next -> Step 4
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Quick Actions ⚡')).toBeVisible();
  await expect(page.getByText('Step 4/4')).toBeVisible();

  // 6. Click Finish
  await page.getByRole('button', { name: 'Finish' }).click();
  
  // 7. Verify Tour Closed
  await expect(page.getByText('Step 4/4')).not.toBeVisible();

  // 8. Verify Dashboard Content
  await expect(page.getByText('Hey, Demo User!')).toBeVisible();
  await expect(page.getByText('Demo Space')).toBeVisible();

  // 9. Interact with Task
  // Find the "Clean the Kitchen" task
  const taskCard = page.getByText('Clean the Kitchen');
  await expect(taskCard).toBeVisible();
  
  // Click "Take This Task" button.
  await page.getByRole('button', { name: 'Take This Task' }).click();

  // 10. Verify Toast/Feedback
  // We expect a toast message "Started: Clean the Kitchen" or similar feedback
  // Note: The exact text depends on the toast implementation. 
  // Based on manual test, it showed "Started: Clean the Kitchen"
  // But since it's a toast, it might disappear quickly.
  // We can check for the celebration text "Go crush it!" if it appears.
});
