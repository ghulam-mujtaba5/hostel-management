import { test, expect } from '@playwright/test';

test.describe('HostelMate App - Complete Feature Testing', () => {
  // Uses baseURL from playwright config (http://localhost:3000)
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  // ==========================================
  // Authentication Tests
  // ==========================================
  
  test('should load login page', async ({ page }) => {
    const heading = page.getByText('Welcome back');
    await expect(heading).toBeVisible();
  });

  test('should show signup form when clicking create account', async ({ page }) => {
    await page.getByText('Sign up').click();
    await page.waitForTimeout(300);
    const heading = page.getByRole('button', { name: 'Create Account' });
    await expect(heading).toBeVisible();
  });

  test.skip('should login with valid credentials', async ({ page }) => {
    // Skipped: Requires valid test user in database
    await page.getByPlaceholder('name@example.com').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/', { timeout: 5000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByPlaceholder('name@example.com').fill('wrong@email.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for error - should stay on login page
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  // ==========================================
  // Navigation Tests (require authentication - skipped)
  // ==========================================

  test.skip('should navigate to all main pages when logged in', async ({ page }) => {
    // Skipped: Requires valid test user in database
  });

  // ==========================================
  // Admin Portal Tests (require authentication - skipped)
  // ==========================================

  test.skip('should access admin portal with correct password', async ({ page }) => {
    // Skipped: Requires valid test user in database
  });

  test.skip('should show admin sections in sidebar', async ({ page }) => {
    // Skipped: Requires valid test user in database
  });

  test.skip('should navigate to admin hostels page', async ({ page }) => {
    // Skipped: Requires valid test user in database
  });

  // ==========================================
  // Home Page Content Tests (require authentication - skipped)
  // ==========================================

  test.skip('should display home page elements after login', async ({ page }) => {
    // Skipped: Requires valid test user in database
  });

  // ==========================================
  // System Status Tests (require authentication - skipped)
  // ==========================================

  test.skip('should show system status in admin', async ({ page }) => {
    // Skipped: Requires valid test user in database
  });

  // ==========================================
  // UI Elements Tests
  // ==========================================

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check login page has essential elements
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
    
    // Check Google OAuth button
    const googleButton = page.getByRole('button', { name: 'Google' });
    await expect(googleButton).toBeVisible();
  });

  // ==========================================
  // Responsive Design Tests
  // ==========================================

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check login form is visible on mobile
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  // ==========================================
  // Performance Tests
  // ==========================================

  test('should load home page in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
