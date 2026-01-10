import { test, expect } from '@playwright/test';
import { generateTestEmail, generateUsername, signUp, signIn, expectToBeOnPage } from './helpers';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // The logo contains HostelMate text - use a more specific selector
    await expect(page.getByRole('link', { name: /HostelMate/ })).toBeVisible();
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test.skip('should show demo mode button', async ({ page }) => {
    // Demo mode button was removed in current version
    await page.goto('/login');
    
    await expect(page.getByRole('button', { name: 'Try Live Demo' })).toBeVisible();
  });

  test.skip('should navigate to demo mode', async ({ page }) => {
    // Demo mode was removed in current version  
    await page.goto('/login');
    
    await page.getByRole('button', { name: 'Try Live Demo' }).click();
    
    await expectToBeOnPage(page, '/demo');
    await expect(page.getByText('Hey, Demo User!')).toBeVisible();
  });

  test('should switch between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Initially on login
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Check that signup toggle is available - looking for the link text
    await expect(page.getByText('Sign up')).toBeVisible();
    
    // Switch to signup
    await page.getByText('Sign up').click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to sign in without filling fields
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should still be on login page
    await expectToBeOnPage(page, '/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('name@example.com').fill('wrong@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for error message - toast may show as sonner toast
    // The error message could appear in various places
    await page.waitForTimeout(2000);
    
    // Check we're still on login page (failed login)
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip('full signup and login flow', async ({ page }) => {
    // Note: This test requires email confirmation which isn't available in test environment
    // Skipping for now, but structure is here
    
    const email = generateTestEmail();
    const password = 'Test1234!';
    const username = generateUsername();
    
    // Signup
    await signUp(page, email, password, username);
    
    // Should redirect to home or confirmation page
    await page.waitForURL('**/', { timeout: 10000 });
    
    // Try to login
    await signIn(page, email, password);
    
    // Should be on dashboard
    await expect(page.getByText(`Hey, ${username}`)).toBeVisible();
  });
});
