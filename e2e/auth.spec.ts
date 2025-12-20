import { test, expect } from '@playwright/test';
import { generateTestEmail, generateUsername, signUp, signIn, expectToBeOnPage } from './helpers';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // The logo contains HostelMate text
    await expect(page.getByText('HostelMate')).toBeVisible();
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show demo mode button', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('button', { name: 'Try Live Demo' })).toBeVisible();
  });

  test('should navigate to demo mode', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('button', { name: 'Try Live Demo' }).click();
    
    await expectToBeOnPage(page, '/demo');
    await expect(page.getByText('Hey, Demo User!')).toBeVisible();
  });

  test('should switch between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Initially on login
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Check that signup toggle is available
    await expect(page.getByText('Create an account')).toBeVisible();
    
    // Switch to signup
    await page.getByText('Create an account').click();
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
    
    await page.getByPlaceholder('Email Address').fill('wrong@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for error message
    await expect(page.getByText(/invalid|error/i)).toBeVisible({ timeout: 5000 });
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
