import { test, expect } from '@playwright/test';

test.describe('HostelMate App - Complete Feature Testing', () => {
  const baseURL = 'https://hostel-management-topaz-ten.vercel.app';
  const testUser = {
    email: 'realtest@hostel.com',
    password: 'testpass123'
  };
  const adminPassword = '123456789';

  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto(baseURL);
  });

  // ==========================================
  // Authentication Tests
  // ==========================================
  
  test('should load login page', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    const heading = page.locator('text=Welcome Back');
    await expect(heading).toBeVisible();
  });

  test('should show signup form when clicking create account', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.click('button:has-text("Create an account")');
    const heading = page.locator('text=Create Account');
    await expect(heading).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    // Fill in credentials
    await page.fill('input[placeholder="Email Address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to home page
    await page.waitForURL(`${baseURL}/`, { timeout: 5000 });
    
    // Verify we're logged in
    const banner = page.locator('banner');
    await expect(banner).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    // Fill in invalid credentials
    await page.fill('input[placeholder="Email Address"]', 'wrong@email.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for error message
    const errorDiv = page.locator('text=Invalid email or password');
    await expect(errorDiv).toBeVisible({ timeout: 3000 });
  });

  // ==========================================
  // Navigation Tests
  // ==========================================

  test('should navigate to all main pages when logged in', async ({ page }) => {
    // Login first
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Email Address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(`${baseURL}/`, { timeout: 5000 });

    // Test Home page
    const homeButton = page.locator('button:has-text("Home")');
    await expect(homeButton).toBeVisible();

    // Navigate to Tasks
    await page.click('a[href="/tasks"]');
    await page.waitForURL(`${baseURL}/tasks`);
    expect(page.url()).toContain('/tasks');

    // Navigate to Leaderboard
    await page.click('a[href="/leaderboard"]');
    await page.waitForURL(`${baseURL}/leaderboard`);
    expect(page.url()).toContain('/leaderboard');

    // Navigate to Feedback
    await page.click('a[href="/feedback"]');
    await page.waitForURL(`${baseURL}/feedback`);
    expect(page.url()).toContain('/feedback');

    // Navigate to Guide
    await page.click('a[href="/guide"]');
    await page.waitForURL(`${baseURL}/guide`);
    expect(page.url()).toContain('/guide');
  });

  // ==========================================
  // Admin Portal Tests
  // ==========================================

  test('should access admin portal with correct password', async ({ page }) => {
    // Login first
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Email Address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(`${baseURL}/`, { timeout: 5000 });

    // Navigate to admin
    await page.click('a[href="/admin"]');
    await page.waitForURL(`${baseURL}/admin`);

    // Should see admin password prompt
    const adminHeading = page.locator('text=Admin Access');
    await expect(adminHeading).toBeVisible();

    // Enter admin password
    await page.fill('input[placeholder="Enter digits 1-9"]', adminPassword);
    await page.click('button:has-text("Unlock Dashboard")');

    // Should see dashboard
    const dashboardHeading = page.locator('text=Product Admin Portal');
    await expect(dashboardHeading).toBeVisible({ timeout: 3000 });
  });

  test('should show admin sections in sidebar', async ({ page }) => {
    // Login and access admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Email Address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(`${baseURL}/`, { timeout: 5000 });

    await page.click('a[href="/admin"]');
    await page.waitForURL(`${baseURL}/admin`);

    // Unlock admin
    await page.fill('input[placeholder="Enter digits 1-9"]', adminPassword);
    await page.click('button:has-text("Unlock Dashboard")');
    await page.waitForTimeout(2000);

    // Check for admin sections
    const hostelLink = page.locator('text=Hostels');
    const userLink = page.locator('text=Users');
    const feedbackLink = page.locator('text=Feedback');
    
    await expect(hostelLink).toBeVisible();
    await expect(userLink).toBeVisible();
    await expect(feedbackLink).toBeVisible();
  });

  test('should navigate to admin hostels page', async ({ page }) => {
    // Login and access admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Email Address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(`${baseURL}/`, { timeout: 5000 });

    // Go to admin and unlock
    await page.click('a[href="/admin"]');
    await page.waitForURL(`${baseURL}/admin`);
    await page.fill('input[placeholder="Enter digits 1-9"]', adminPassword);
    await page.click('button:has-text("Unlock Dashboard")');
    await page.waitForTimeout(2000);

    // Click hostels link
    await page.click('a[href="/admin/hostels"]');
    await page.waitForURL(`${baseURL}/admin/hostels`);
    expect(page.url()).toContain('/admin/hostels');
  });

  // ==========================================
  // Home Page Content Tests
  // ==========================================

  test('should display home page elements after login', async ({ page }) => {
    // Login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Email Address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(`${baseURL}/`, { timeout: 5000 });

    // Check for main navigation
    const navbar = page.locator('banner');
    await expect(navbar).toBeVisible();

    // Check for logo
    const logo = page.locator('text=HostelMate');
    await expect(logo).toBeVisible();
  });

  // ==========================================
  // System Status Tests
  // ==========================================

  test('should show system status in admin', async ({ page }) => {
    // Login and access admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Email Address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(`${baseURL}/`, { timeout: 5000 });

    await page.click('a[href="/admin"]');
    await page.waitForURL(`${baseURL}/admin`);
    await page.fill('input[placeholder="Enter digits 1-9"]', adminPassword);
    await page.click('button:has-text("Unlock Dashboard")');
    await page.waitForTimeout(2000);

    // Check for system status
    const statusItems = page.locator('text=Database Connection', {
      exact: false
    });
    await expect(statusItems).toBeVisible();

    const authStatus = page.locator('text=Authentication Service');
    await expect(authStatus).toBeVisible();
  });

  // ==========================================
  // UI Elements Tests
  // ==========================================

  test('should show BETA label on home page', async ({ page }) => {
    await page.goto(`${baseURL}`);
    const betaLabel = page.locator('text=BETA');
    await expect(betaLabel).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto(`${baseURL}`);
    
    // Check all navigation links are present
    const homeLink = page.locator('a[href="/"]');
    const tasksLink = page.locator('a[href="/tasks"]');
    const leaderboardLink = page.locator('a[href="/leaderboard"]');
    const feedbackLink = page.locator('a[href="/feedback"]');
    const guideLink = page.locator('a[href="/guide"]');
    const adminLink = page.locator('a[href="/admin"]');

    await expect(homeLink).toBeVisible();
    await expect(tasksLink).toBeVisible();
    await expect(leaderboardLink).toBeVisible();
    await expect(feedbackLink).toBeVisible();
    await expect(guideLink).toBeVisible();
    await expect(adminLink).toBeVisible();
  });

  // ==========================================
  // Responsive Design Tests
  // ==========================================

  test('should be responsive on mobile viewport', async ({ page }) => {
    page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseURL}`);
    
    const navbar = page.locator('banner');
    await expect(navbar).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${baseURL}`);
    
    const navbar = page.locator('banner');
    await expect(navbar).toBeVisible();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseURL}`);
    
    const navbar = page.locator('banner');
    await expect(navbar).toBeVisible();
  });

  // ==========================================
  // Performance Tests
  // ==========================================

  test('should load home page in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${baseURL}`, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
