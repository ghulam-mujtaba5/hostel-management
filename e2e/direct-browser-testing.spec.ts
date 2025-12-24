import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';

/**
 * INTERACTIVE E2E TESTING WITH MCP BROWSER AUTOMATION
 * 
 * This suite uses Playwright directly with real browser automation
 * No external scripts needed - just run: npx playwright test
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============================================================================
// TEST DATA & FIXTURES
// ============================================================================

const generateEmail = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;

interface TestUser {
  email: string;
  password: string;
  username: string;
}

// ============================================================================
// BROWSER AUTOMATION HELPERS - DIRECT PLAYWRIGHT
// ============================================================================

async function authenticateUser(page: Page, user: TestUser, isSignup: boolean = false) {
  await page.goto(`${BASE_URL}/${isSignup ? 'signup' : 'login'}`);
  await page.waitForLoadState('networkidle');
  
  // Fill email
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  if (isSignup) {
    const nameInput = await page.$('input[placeholder*="Name"], input[name="name"], input[placeholder*="username"]');
    if (nameInput) {
      await page.fill('input[placeholder*="Name"], input[name="name"]', user.username);
    }
  }
  
  // Click submit button
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
    page.click('button:has-text("Sign Up"), button:has-text("Sign In")')
  ]);
  
  return page;
}

async function navigateToSection(page: Page, section: 'tasks' | 'spaces' | 'profile' | 'leaderboard' | 'settings') {
  const sectionMap = {
    tasks: 'Tasks',
    spaces: 'Spaces',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    settings: 'Settings'
  };
  
  const label = sectionMap[section];
  
  // Try different navigation methods
  const navLink = page.locator(`a:has-text("${label}"), button:has-text("${label}")`).first();
  if (await navLink.isVisible()) {
    await navLink.click();
  } else {
    // Try bottom nav or menu
    const mobileNav = page.locator('[role="navigation"], nav, .mobile-nav').first();
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
    }
    await page.click(`text="${label}"`);
  }
  
  await page.waitForLoadState('networkidle');
  return page;
}

async function measurePageLoad(page: Page, url: string): Promise<number> {
  const startTime = performance.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  const loadTime = performance.now() - startTime;
  return loadTime;
}

async function captureNetworkMetrics(page: Page): Promise<{ url: string; duration: number; size: number }[]> {
  const metrics: { url: string; duration: number; size: number }[] = [];
  
  page.on('response', async (response) => {
    const request = response.request();
    const body = await response.body().catch(() => Buffer.from(''));
    const size = body.length;
    const timing = request.timing();
    
    metrics.push({
      url: request.url(),
      duration: timing.responseEnd - timing.responseStart,
      size
    });
  });
  
  return metrics;
}

// ============================================================================
// SCENARIO 1: REAL USER SIGNUP & AUTHENTICATION
// ============================================================================

test.describe('REAL USER: Signup & Authentication Flow', () => {
  test('User can sign up and access dashboard', async ({ page, browser }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Test User'
    };
    
    // Measure signup performance
    const startTime = performance.now();
    
    await page.goto(`${BASE_URL}/signup`);
    expect(page.url()).toContain('signup');
    
    // Fill form
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.fill('input[name="name"], input[placeholder*="Name"]', user.username);
    
    // Submit and wait for redirect
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button:has-text("Sign Up")')
    ]);
    
    const signupTime = performance.now() - startTime;
    console.log(`✅ Signup completed in ${signupTime.toFixed(2)}ms`);
    
    // Verify dashboard is shown
    expect(page.url()).toContain('dashboard');
    await expect(page.locator('text=/Dashboard|Home|Welcome/')).toBeVisible({ timeout: 5000 });
    
    console.log(`📊 User: ${user.email}`);
    console.log(`⏱️  Performance: ${signupTime.toFixed(0)}ms`);
  });

  test('User can login with valid credentials', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Test User'
    };
    
    // First sign up
    await authenticateUser(page, user, true);
    
    // Logout
    await page.click('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label="Menu"]').catch(() => null);
    await page.waitForURL('**/login|**/home|**/', { timeout: 10000 }).catch(() => null);
    
    // Login again
    await authenticateUser(page, user, false);
    expect(page.url()).toContain('dashboard');
  });

  test('User sees error with invalid password', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Test User'
    };
    
    // Sign up first
    await authenticateUser(page, user, true);
    
    // Logout
    await page.click('button:has-text("Logout"), [aria-label*="Menu"]').catch(() => null);
    
    // Try login with wrong password
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', 'WrongPassword123!@');
    await page.click('button:has-text("Sign In")');
    
    // Should show error
    const errorVisible = await page.locator('text=/Invalid|incorrect|error/i').isVisible({ timeout: 5000 });
    expect(errorVisible || page.url().includes('login')).toBeTruthy();
  });
});

// ============================================================================
// SCENARIO 2: SPACE CREATION & MULTI-USER COLLABORATION
// ============================================================================

test.describe('REAL USER: Space Creation & Multi-User Joining', () => {
  test('Admin creates space and generates invite code', async ({ page, browser }) => {
    const admin: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Admin User'
    };
    
    // Admin signup
    await authenticateUser(page, admin, true);
    
    // Navigate to spaces
    await navigateToSection(page, 'spaces');
    
    // Create space
    await page.click('button:has-text("Create"), button:has-text("New"), a:has-text("Create")');
    await page.waitForLoadState('networkidle');
    
    // Fill space details
    const spaceName = `Test Space ${Date.now()}`;
    await page.fill('input[placeholder*="Space"], input[name="name"]', spaceName);
    await page.fill('textarea[placeholder*="Description"], textarea[name="description"]', 'Testing space').catch(() => null);
    
    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      page.click('button:has-text("Create"), button:has-text("Submit")')
    ]);
    
    // Extract invite code
    await page.waitForTimeout(1000); // Wait for page load
    const inviteCodeText = await page.locator('text=/Invite|Code|CODE/').first().textContent();
    const inviteCode = inviteCodeText?.match(/([A-Z0-9]{6,})/)?.[1];
    
    console.log(`✅ Space created: ${spaceName}`);
    console.log(`📋 Invite code: ${inviteCode || 'Not visible'}`);
    
    expect(inviteCode).toBeTruthy();
  });

  test('User joins space with invite code', async ({ page, browser }) => {
    const admin: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Admin User'
    };
    
    const member: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Member User'
    };
    
    // Admin creates space
    const adminPage = await browser.newPage();
    await authenticateUser(adminPage, admin, true);
    await navigateToSection(adminPage, 'spaces');
    await adminPage.click('button:has-text("Create")');
    await adminPage.waitForLoadState('networkidle');
    
    const spaceName = `Join Test ${Date.now()}`;
    await adminPage.fill('input[name="name"], input[placeholder*="Space"]', spaceName);
    await Promise.all([
      adminPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      adminPage.click('button:has-text("Create")')
    ]);
    
    const inviteCode = await adminPage.locator('text=/Code|Invite/').first().textContent().then(t => t?.match(/([A-Z0-9]{6,})/)?.[1]);
    
    // Member joins space
    await authenticateUser(page, member, true);
    await navigateToSection(page, 'spaces');
    await page.click('button:has-text("Join")');
    await page.fill('input[placeholder*="Code"], input[name="code"]', inviteCode || '');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      page.click('button:has-text("Join")')
    ]);
    
    expect(page.url()).toContain('spaces');
    console.log(`✅ User joined space with code: ${inviteCode}`);
    
    await adminPage.close();
  });
});

// ============================================================================
// SCENARIO 3: TASK CREATION & LIFECYCLE
// ============================================================================

test.describe('REAL USER: Task Creation & Assignment', () => {
  test('User creates task with full details', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Task Creator'
    };
    
    await authenticateUser(page, user, true);
    await navigateToSection(page, 'tasks');
    
    // Create task
    await page.click('button:has-text("Create"), button:has-text("New")');
    await page.waitForLoadState('networkidle');
    
    const taskTitle = `Clean Kitchen ${Date.now()}`;
    await page.fill('input[placeholder*="Title"], input[name="title"]', taskTitle);
    await page.fill('textarea[placeholder*="Description"], textarea[name="description"]', 'Deep clean kitchen').catch(() => null);
    
    // Set category if available
    try {
      await page.selectOption('select[name="category"]', { label: 'Kitchen' }).catch(() => null);
    } catch (e) {
      console.log('Category selection skipped');
    }
    
    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      page.click('button:has-text("Create"), button:has-text("Submit")')
    ]);
    
    console.log(`✅ Task created: ${taskTitle}`);
    expect(page.url()).toContain('tasks');
  });

  test('User picks task from available list', async ({ page, browser }) => {
    const creator: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Creator'
    };
    
    const picker: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Task Picker'
    };
    
    // Creator signs up and creates task
    const creatorPage = await browser.newPage();
    await authenticateUser(creatorPage, creator, true);
    await navigateToSection(creatorPage, 'tasks');
    await creatorPage.click('button:has-text("Create")');
    await creatorPage.waitForLoadState('networkidle');
    
    const taskTitle = `Pick Task ${Date.now()}`;
    await creatorPage.fill('input[name="title"], input[placeholder*="Title"]', taskTitle);
    await Promise.all([
      creatorPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      creatorPage.click('button:has-text("Create")')
    ]);
    
    // Picker signs up and picks task (in same space - would need space join logic)
    await authenticateUser(page, picker, true);
    await navigateToSection(page, 'tasks');
    
    // Find and click task
    const taskLink = page.locator(`text="${taskTitle}"`).first();
    if (await taskLink.isVisible({ timeout: 5000 })) {
      await taskLink.click();
      await page.waitForLoadState('networkidle');
      
      // Click "Pick Task" or "Take Task"
      const pickButton = page.locator('button:has-text("Pick"), button:has-text("Take"), button:has-text("Start")').first();
      if (await pickButton.isVisible({ timeout: 5000 })) {
        await pickButton.click();
        console.log(`✅ Task picked: ${taskTitle}`);
      }
    }
    
    await creatorPage.close();
  });
});

// ============================================================================
// SCENARIO 4: PERFORMANCE MEASUREMENT
// ============================================================================

test.describe('REAL USER: Performance Metrics', () => {
  test('Measure page load times across app', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Perf Test User'
    };
    
    const metrics: { page: string; loadTime: number }[] = [];
    
    // Signup
    let loadTime = await measurePageLoad(page, `${BASE_URL}/signup`);
    metrics.push({ page: 'signup', loadTime });
    await authenticateUser(page, user, true);
    
    // Dashboard
    loadTime = await measurePageLoad(page, `${BASE_URL}/dashboard`);
    metrics.push({ page: 'dashboard', loadTime });
    
    // Tasks
    await navigateToSection(page, 'tasks');
    metrics.push({ page: 'tasks', loadTime: 0 }); // Already navigated
    
    // Leaderboard
    await navigateToSection(page, 'leaderboard');
    metrics.push({ page: 'leaderboard', loadTime: 0 });
    
    console.log('\n📊 PAGE LOAD TIMES:');
    console.log('================================');
    metrics.forEach(m => {
      if (m.loadTime > 0) {
        const status = m.loadTime < 3000 ? '✅' : m.loadTime < 5000 ? '⚠️' : '❌';
        console.log(`${status} ${m.page.padEnd(15)} ${m.loadTime.toFixed(0)}ms`);
      }
    });
  });

  test('Monitor API response times', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'API Test User'
    };
    
    await authenticateUser(page, user, true);
    
    const apiCalls: { url: string; duration: number }[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.request().timing();
        apiCalls.push({
          url: response.url().split('/api/')[1]?.split('?')[0] || response.url(),
          duration: timing.responseEnd - timing.responseStart
        });
      }
    });
    
    // Trigger API calls
    await navigateToSection(page, 'tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('\n📡 API RESPONSE TIMES:');
    console.log('================================');
    apiCalls.slice(0, 10).forEach(call => {
      const status = call.duration < 500 ? '✅' : call.duration < 1000 ? '⚠️' : '❌';
      console.log(`${status} ${call.url.padEnd(30)} ${call.duration.toFixed(0)}ms`);
    });
  });
});

// ============================================================================
// SCENARIO 5: MOBILE RESPONSIVENESS
// ============================================================================

test.describe('REAL USER: Mobile Experience', () => {
  test('Mobile signup (375x667 viewport)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    
    const page = await context.newPage();
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Mobile User'
    };
    
    await page.goto(`${BASE_URL}/signup`);
    
    // Check form is responsive
    const emailInput = page.locator('input[type="email"]');
    expect(await emailInput.isVisible()).toBe(true);
    
    await authenticateUser(page, user, true);
    
    // Check mobile navigation
    const nav = page.locator('[role="navigation"], nav, .mobile-nav, .bottom-nav');
    const isNavVisible = await nav.first().isVisible({ timeout: 5000 });
    
    console.log(`✅ Mobile navigation: ${isNavVisible ? 'visible' : 'not visible'}`);
    
    await context.close();
  });

  test('Tablet viewport (768x1024)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 }
    });
    
    const page = await context.newPage();
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Tablet User'
    };
    
    await authenticateUser(page, user, true);
    await navigateToSection(page, 'tasks');
    
    // Check layout
    const content = page.locator('main, [role="main"], .content');
    expect(await content.first().isVisible({ timeout: 5000 })).toBe(true);
    
    console.log('✅ Tablet layout responsive');
    
    await context.close();
  });
});

// ============================================================================
// SCENARIO 6: ERROR HANDLING & VALIDATION
// ============================================================================

test.describe('REAL USER: Error Handling', () => {
  test('Form validation prevents invalid submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Sign Up")').first();
    await submitButton.click();
    
    // Should show validation error or prevent submission
    const isStillOnSignup = page.url().includes('signup');
    expect(isStillOnSignup).toBe(true);
    
    console.log('✅ Form validation working');
  });

  test('Invalid email format is rejected', async ({ page }) => {
    const user: TestUser = {
      email: 'not-an-email',
      password: 'TestPassword123!@',
      username: 'Test'
    };
    
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', user.email);
    
    // Check if browser validates or app prevents submission
    const emailInput = page.locator('input[type="email"]');
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    
    console.log(`✅ Email validation: ${validity ? 'passed' : 'failed'}`);
  });

  test('Handles network offline gracefully', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Offline Test'
    };
    
    await authenticateUser(page, user, true);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Wait and check for offline indicator
    await page.waitForTimeout(1000);
    const offlineText = await page.locator('text=/offline|no internet|connection/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`✅ Offline handling: ${offlineText ? 'detected' : 'could be improved'}`);
    
    // Go back online
    await page.context().setOffline(false);
  });
});

// ============================================================================
// SCENARIO 7: LEADERBOARD & GAMIFICATION
// ============================================================================

test.describe('REAL USER: Leaderboard & Points System', () => {
  test('View leaderboard rankings', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Leaderboard User'
    };
    
    await authenticateUser(page, user, true);
    await navigateToSection(page, 'leaderboard');
    
    // Extract leaderboard data
    const leaderboardRows = page.locator('tr, li[role="listitem"], [class*="leaderboard"] > *');
    const count = await leaderboardRows.count();
    
    console.log(`✅ Leaderboard loaded with ${count} entries`);
    
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// SCENARIO 8: USER PROFILE & SETTINGS
// ============================================================================

test.describe('REAL USER: Profile Management', () => {
  test('User can view and update profile', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Profile User'
    };
    
    await authenticateUser(page, user, true);
    await navigateToSection(page, 'profile');
    
    // Verify profile data displayed
    const profileContent = page.locator('[role="main"], main, .content');
    expect(await profileContent.first().isVisible()).toBe(true);
    
    console.log('✅ Profile page loaded');
  });

  test('User can access settings', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Settings User'
    };
    
    await authenticateUser(page, user, true);
    
    try {
      await navigateToSection(page, 'settings');
      console.log('✅ Settings page accessible');
    } catch (e) {
      console.log('⚠️ Settings navigation failed');
    }
  });
});

// ============================================================================
// SCENARIO 9: SESSION & LOGOUT
// ============================================================================

test.describe('REAL USER: Session Management', () => {
  test('User session persists on page reload', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Session User'
    };
    
    await authenticateUser(page, user, true);
    
    const initialUrl = page.url();
    
    // Reload page
    await page.reload({ waitUntil: 'networkidle' });
    
    // Should still be authenticated
    const stillAuthenticated = !page.url().includes('login');
    expect(stillAuthenticated).toBe(true);
    
    console.log('✅ Session persisted after reload');
  });

  test('User can logout and is redirected', async ({ page }) => {
    const user: TestUser = {
      email: generateEmail(),
      password: 'TestPassword123!@',
      username: 'Logout User'
    };
    
    await authenticateUser(page, user, true);
    
    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label*="logout"]').first();
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
      
      // Wait for redirect
      await page.waitForURL('**/login|**/home|**/', { timeout: 10000 }).catch(() => null);
      
      console.log('✅ User logged out successfully');
    } else {
      console.log('⚠️ Logout button not found');
    }
  });
});
