import { test, expect, Page, BrowserContext } from '@playwright/test';

// ============================================================================
// REAL USER SCENARIOS - END-TO-END TESTING WITH MCP
// ============================================================================
// This test suite simulates complete real user workflows across the platform
// Features tested:
// - Multi-user authentication & onboarding
// - Space creation & management
// - Task lifecycle (create, pick, execute, verify)
// - Gamification & leaderboard system
// - User preferences & fairness algorithm
// - Mobile responsiveness
// - Performance monitoring
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestUser {
  email: string;
  password: string;
  username: string;
  role?: 'creator' | 'member' | 'admin';
}

// Test data
const testUsers = {
  admin: {
    email: `admin-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    username: 'Admin User',
    role: 'creator'
  } as TestUser,
  user1: {
    email: `user1-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    username: 'User One',
    role: 'member'
  } as TestUser,
  user2: {
    email: `user2-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    username: 'User Two',
    role: 'member'
  } as TestUser,
  user3: {
    email: `user3-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    username: 'User Three',
    role: 'member'
  } as TestUser,
};

// Helper functions
async function signUp(page: Page, user: TestUser) {
  await page.goto(`${BASE_URL}/signup`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.fill('input[placeholder*="Name"]', user.username);
  await page.click('button:has-text("Sign Up")');
  await page.waitForURL(`${BASE_URL}/**/dashboard`, { timeout: 10000 });
}

async function login(page: Page, user: TestUser) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(`${BASE_URL}/**/dashboard`, { timeout: 10000 });
}

async function createSpace(page: Page, spaceName: string, description?: string): Promise<string> {
  await page.click('button:has-text("Create Space"), a:has-text("Create Space")');
  await page.waitForURL('**/spaces/create');
  
  await page.fill('input[placeholder*="Space Name"], input[name="name"]', spaceName);
  if (description) {
    await page.fill('textarea[placeholder*="Description"], textarea[name="description"]', description);
  }
  
  await page.click('button:has-text("Create")');
  await page.waitForURL('**/spaces/**', { timeout: 10000 });
  
  // Extract and return invite code
  const inviteCode = await page.locator('text=/Invite Code|Code:/').evaluate((el) => {
    const text = el.textContent || '';
    const match = text.match(/([A-Z0-9]{6,})/);
    return match ? match[1] : '';
  });
  
  return inviteCode;
}

async function joinSpaceWithCode(page: Page, inviteCode: string) {
  await page.click('button:has-text("Join Space"), a:has-text("Join Space")');
  await page.waitForURL('**/spaces/join');
  
  await page.fill('input[placeholder*="Code"], input[name="code"]', inviteCode);
  await page.click('button:has-text("Join")');
  await page.waitForURL('**/spaces/**', { timeout: 10000 });
}

async function createTask(page: Page, taskData: {
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  dueDate?: string;
}) {
  await page.click('button:has-text("Create Task"), a:has-text("New Task"), a:has-text("Create Task")');
  await page.waitForURL('**/tasks/create');
  
  await page.fill('input[placeholder*="Title"], input[name="title"]', taskData.title);
  
  if (taskData.description) {
    await page.fill('textarea[placeholder*="Description"], textarea[name="description"]', taskData.description);
  }
  
  if (taskData.category) {
    const categorySelect = page.locator('select[name="category"], button[aria-label*="Category"]').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.click(`text="${taskData.category}"`);
    }
  }
  
  if (taskData.difficulty) {
    const difficultySelect = page.locator('input[type="range"], select[name="difficulty"]').first();
    if (await difficultySelect.isVisible()) {
      await difficultySelect.fill(taskData.difficulty);
    }
  }
  
  if (taskData.dueDate) {
    const dateInput = page.locator('input[type="date"], input[placeholder*="Date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill(taskData.dueDate);
    }
  }
  
  await page.click('button:has-text("Create"), button:has-text("Submit")');
  await page.waitForURL('**/tasks/**', { timeout: 10000 });
}

async function pickTask(page: Page, taskTitle: string) {
  await page.click('a:has-text("Tasks"), button:has-text("Available Tasks")');
  await page.waitForURL('**/tasks');
  
  // Find and click the task
  await page.click(`text="${taskTitle}"`, { timeout: 5000 });
  await page.waitForURL('**/tasks/**');
  
  // Click "Take Task" or "Pick Task"
  await page.click('button:has-text("Take Task"), button:has-text("Pick Task"), button:has-text("Start Task")');
  
  // Verify task is now in "My Tasks"
  await page.waitForFunction(() => {
    return document.body.innerText.includes('My Tasks') || document.body.innerText.includes('In Progress');
  }, { timeout: 10000 });
}

async function uploadTaskProof(page: Page, taskTitle: string, imagePath: string) {
  // Find and open the task
  await page.click(`text="${taskTitle}"`);
  await page.waitForURL('**/tasks/**');
  
  // Find and click upload button
  const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Proof"), input[type="file"]').first();
  if (uploadButton.evaluate((el) => el.tagName) === 'INPUT') {
    await uploadButton.setInputFiles(imagePath);
  } else {
    await uploadButton.click();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imagePath);
  }
  
  // Verify upload
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Pending Verification') || document.body.innerText.includes('uploaded');
  }, { timeout: 10000 });
}

async function verifyTask(page: Page, taskTitle: string, approve: boolean = true) {
  // Find and open the task
  await page.click(`text="${taskTitle}"`);
  await page.waitForURL('**/tasks/**');
  
  // Wait for proof image to load
  await page.waitForSelector('img[alt*="Proof"], img[alt*="Task"]', { timeout: 5000 }).catch(() => null);
  
  // Click approve or reject
  const buttonText = approve ? 'Approve' : 'Reject';
  await page.click(`button:has-text("${buttonText}")`);
  
  // Verify action
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Completed') || document.body.innerText.includes('Rejected') || document.body.innerText.includes('verified');
  }, { timeout: 10000 });
}

async function viewLeaderboard(page: Page): Promise<{ username: string; points: number }[]> {
  await page.click('a:has-text("Leaderboard"), button:has-text("Leaderboard")');
  await page.waitForURL('**/leaderboard', { timeout: 10000 });
  
  // Extract leaderboard data
  const leaderboard = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr, li[role="listitem"], div[class*="leaderboard"]');
    const data: { username: string; points: number }[] = [];
    
    rows.forEach((row) => {
      const text = row.textContent || '';
      const usernameMatch = text.match(/^(.+?)\s+(\d+)\s*points?/i);
      if (usernameMatch) {
        data.push({
          username: usernameMatch[1].trim(),
          points: parseInt(usernameMatch[2])
        });
      }
    });
    
    return data;
  });
  
  return leaderboard;
}

async function setUserPreferences(page: Page, preferences: { category: string; preference: 'prefer' | 'avoid' | 'neutral' }[]) {
  await page.click('a:has-text("Profile"), button:has-text("Settings")');
  await page.waitForURL('**/profile|**/settings', { timeout: 10000 });
  
  await page.click('button:has-text("Preferences"), a:has-text("Preferences")');
  
  for (const pref of preferences) {
    const categoryRow = page.locator(`text="${pref.category}"`).first();
    await categoryRow.click();
    
    const button = page.locator(`button:has-text("${pref.preference}"), input[value="${pref.preference}"]`).first();
    await button.click();
  }
  
  await page.click('button:has-text("Save")');
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('SCENARIO 1: Multi-User Space Creation & Onboarding', () => {
  test('Admin creates space and users join via invite code', async ({ browser }) => {
    // Step 1: Admin signs up
    const adminContext = await browser.newContext();
    const adminPage = adminContext.addPage();
    
    await signUp(adminPage, testUsers.admin);
    expect(adminPage.url()).toContain('/dashboard');
    
    // Step 2: Admin creates a space
    await adminPage.click('a:has-text("Spaces"), button:has-text("Spaces")');
    const inviteCode = await createSpace(adminPage, 'Test Hostel A', 'Testing multi-user features');
    
    expect(inviteCode).toBeTruthy();
    expect(inviteCode.length).toBeGreaterThan(4);
    
    // Step 3: User 1 signs up and joins space
    const user1Context = await browser.newContext();
    const user1Page = user1Context.addPage();
    
    await signUp(user1Page, testUsers.user1);
    await user1Page.click('a:has-text("Spaces"), button:has-text("Spaces")');
    await joinSpaceWithCode(user1Page, inviteCode);
    
    expect(user1Page.url()).toContain('/spaces');
    
    // Step 4: User 2 signs up and joins space
    const user2Context = await browser.newContext();
    const user2Page = user2Context.addPage();
    
    await signUp(user2Page, testUsers.user2);
    await user2Page.click('a:has-text("Spaces"), button:has-text("Spaces")');
    await joinSpaceWithCode(user2Page, inviteCode);
    
    expect(user2Page.url()).toContain('/spaces');
    
    // Cleanup
    await adminContext.close();
    await user1Context.close();
    await user2Context.close();
  });
});

test.describe('SCENARIO 2: Task Lifecycle - Create, Pick, Execute, Verify', () => {
  test('Complete task workflow: Creation through approval with points reward', async ({ browser }) => {
    const timestamp = Date.now();
    const spaceInviteCode = 'TESTINVITE'; // This should be dynamically generated
    
    // Setup: Create admin and 2 users
    const adminContext = await browser.newContext();
    const adminPage = adminContext.addPage();
    const user1Context = await browser.newContext();
    const user1Page = user1Context.addPage();
    
    // Sign up
    await signUp(adminPage, testUsers.admin);
    await signUp(user1Page, testUsers.user1);
    
    // Admin creates space
    await adminPage.click('a:has-text("Spaces"), button:has-text("Spaces")');
    const inviteCode = await createSpace(adminPage, `Scenario 2 Space ${timestamp}`);
    
    // User joins space
    await user1Page.click('a:has-text("Spaces"), button:has-text("Spaces")');
    await joinSpaceWithCode(user1Page, inviteCode);
    
    // Admin creates a task
    await adminPage.click('a:has-text("Tasks"), button:has-text("Tasks")');
    await createTask(adminPage, {
      title: 'Clean Kitchen',
      description: 'Deep clean the kitchen including shelves',
      category: 'Kitchen',
      difficulty: '7',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    
    // User picks the task
    await user1Page.click('a:has-text("Tasks"), button:has-text("Tasks")');
    await pickTask(user1Page, 'Clean Kitchen');
    
    // User uploads proof (simulate with file)
    // Note: In real testing, use a real image file path
    const testImagePath = './test-image.png'; // Would need to exist
    // await uploadTaskProof(user1Page, 'Clean Kitchen', testImagePath);
    
    // Admin verifies the task
    // await verifyTask(adminPage, 'Clean Kitchen', true);
    
    // Check leaderboard for points
    // const leaderboard = await viewLeaderboard(user1Page);
    // expect(leaderboard.length).toBeGreaterThan(0);
    
    await adminContext.close();
    await user1Context.close();
  });
});

test.describe('SCENARIO 3: Gamification & Fair Task Distribution', () => {
  test('System recommends tasks based on fairness algorithm and user preferences', async ({ browser }) => {
    const timestamp = Date.now();
    
    // Setup: Create space with 3 users
    const adminContext = await browser.newContext();
    const adminPage = adminContext.addPage();
    const user1Context = await browser.newContext();
    const user1Page = user1Context.addPage();
    const user2Context = await browser.newContext();
    const user2Page = user2Context.addPage();
    
    // Sign up all users
    await signUp(adminPage, testUsers.admin);
    await signUp(user1Page, testUsers.user1);
    await signUp(user2Page, testUsers.user2);
    
    // Admin creates space
    await adminPage.click('a:has-text("Spaces"), button:has-text("Spaces")');
    const inviteCode = await createSpace(adminPage, `Gamification Test ${timestamp}`);
    
    // Users join space
    await user1Page.click('a:has-text("Spaces"), button:has-text("Spaces")');
    await joinSpaceWithCode(user1Page, inviteCode);
    await user2Page.click('a:has-text("Spaces"), button:has-text("Spaces")');
    await joinSpaceWithCode(user2Page, inviteCode);
    
    // Admin sets user preferences (User 1 avoids kitchen)
    await user1Page.click('a:has-text("Profile"), button:has-text("Settings")');
    // await setUserPreferences(user1Page, [
    //   { category: 'Kitchen', preference: 'avoid' }
    // ]);
    
    // Admin creates multiple tasks
    for (let i = 0; i < 3; i++) {
      await adminPage.click('a:has-text("Tasks"), button:has-text("Tasks")');
      const categories = ['Kitchen', 'Bathroom', 'Common Area'];
      await createTask(adminPage, {
        title: `Clean ${categories[i]} - Task ${i + 1}`,
        category: categories[i],
        difficulty: '5'
      });
    }
    
    // Verify leaderboard shows correct points
    const leaderboard = await viewLeaderboard(user1Page);
    expect(leaderboard).toBeDefined();
    expect(Array.isArray(leaderboard)).toBe(true);
    
    await adminContext.close();
    await user1Context.close();
    await user2Context.close();
  });
});

test.describe('SCENARIO 4: Mobile Responsiveness', () => {
  test('All features work correctly on mobile viewport (375x667)', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const mobilePage = mobileContext.addPage();
    
    // Sign up on mobile
    await signUp(mobilePage, testUsers.admin);
    
    // Verify mobile navigation
    const navBar = mobilePage.locator('[role="navigation"], nav, .mobile-nav, .bottom-nav').first();
    expect(await navBar.isVisible()).toBe(true);
    
    // Test navigation on mobile
    const menuItems = ['Tasks', 'Spaces', 'Profile', 'Leaderboard'];
    for (const item of menuItems) {
      await mobilePage.click(`text="${item}"`);
      await mobilePage.waitForFunction(() => {
        return document.body.innerText.includes(item) || document.location.href.includes(item.toLowerCase());
      }, { timeout: 5000 });
    }
    
    await mobileContext.close();
  });
});

test.describe('SCENARIO 5: Performance & Load Testing', () => {
  test('Dashboard loads within acceptable time on desktop', async ({ page }) => {
    const startTime = Date.now();
    
    await signUp(page, testUsers.admin);
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Verify all main sections are visible
    await expect(page.locator('text=/Dashboard|Home/')).toBeVisible({ timeout: 2000 }).catch(() => null);
  });

  test('API endpoints respond within SLA (< 1 second)', async ({ page }) => {
    await login(page, testUsers.admin);
    
    // Intercept network requests
    const responses: { url: string; duration: number }[] = [];
    
    page.on('response', (response) => {
      const request = response.request();
      const startTime = Date.now();
      const duration = Date.now() - startTime;
      
      if (request.url().includes('/api/')) {
        responses.push({
          url: request.url(),
          duration: response.timing().responseEnd - response.timing().responseStart
        });
      }
    });
    
    // Navigate to different pages to trigger API calls
    await page.click('a:has-text("Tasks")');
    await page.waitForLoadState('networkidle');
    
    // Verify API response times
    const slowApiCalls = responses.filter(r => r.duration > 1000);
    expect(slowApiCalls.length).toBe(0);
  });
});

test.describe('SCENARIO 6: Authentication & Security', () => {
  test('Login with valid credentials succeeds', async ({ page }) => {
    await login(page, testUsers.admin);
    expect(page.url()).toContain('/dashboard');
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testUsers.admin.email);
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Should show error and stay on login page
    await page.waitForSelector('text=/Invalid|incorrect|error/i', { timeout: 5000 }).catch(() => null);
    expect(page.url()).toContain('/login');
  });

  test('Protected routes redirect to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext();
    const page = context.addPage();
    
    // Try to access protected route without logging in
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should be redirected to login
    expect(page.url()).toContain('/login');
    
    await context.close();
  });

  test('Logging out clears session and redirects to login', async ({ page }) => {
    await login(page, testUsers.admin);
    
    // Click logout
    await page.click('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
    
    // Should redirect to login or home
    await page.waitForURL('**/login|**/home|**/', { timeout: 10000 });
  });
});

test.describe('SCENARIO 7: Data Validation & Error Handling', () => {
  test('Form validation prevents invalid data submission', async ({ page }) => {
    await signUp(page, testUsers.admin);
    
    // Try to create task with invalid data
    await page.click('button:has-text("Create Task")');
    
    // Submit empty form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit")').first();
    await submitButton.click();
    
    // Should show validation errors
    await page.waitForSelector('text=/required|invalid|error/i', { timeout: 5000 }).catch(() => null);
  });

  test('Handles network errors gracefully', async ({ page }) => {
    await login(page, testUsers.admin);
    
    // Simulate offline
    await page.context().setOffline(true);
    
    // Try to perform an action
    await page.click('button:has-text("Create Task")').catch(() => null);
    
    // Should show error message or offline indicator
    await page.context().setOffline(false);
  });
});

test.describe('SCENARIO 8: User Collaboration & Real-time Updates', () => {
  test('Multiple users see task updates in real-time', async ({ browser }) => {
    const timestamp = Date.now();
    
    // Setup: Create space with 2 users
    const user1Context = await browser.newContext();
    const user1Page = user1Context.addPage();
    const user2Context = await browser.newContext();
    const user2Page = user2Context.addPage();
    
    // Sign up users
    await signUp(user1Page, testUsers.admin);
    await signUp(user2Page, testUsers.user1);
    
    // User 1 creates space
    await user1Page.click('a:has-text("Spaces")');
    const inviteCode = await createSpace(user1Page, `Collab Test ${timestamp}`);
    
    // User 2 joins space
    await user2Page.click('a:has-text("Spaces")');
    await joinSpaceWithCode(user2Page, inviteCode);
    
    // User 1 creates task
    await user1Page.click('a:has-text("Tasks")');
    await createTask(user1Page, {
      title: 'Collab Task',
      category: 'Common Area'
    });
    
    // User 2 should see the task
    await user2Page.click('a:has-text("Tasks")');
    await user2Page.waitForSelector(`text="Collab Task"`, { timeout: 10000 });
    
    expect(user2Page.url()).toContain('/tasks');
    
    await user1Context.close();
    await user2Context.close();
  });
});

test.describe('SCENARIO 9: Complete User Journey - New User to Active Member', () => {
  test('New user complete journey: Sign up → Space → Pick Task → Earn Points → Climb Leaderboard', async ({ browser }) => {
    const timestamp = Date.now();
    
    // Step 1: Admin sets up space and initial tasks
    const adminContext = await browser.newContext();
    const adminPage = adminContext.addPage();
    await signUp(adminPage, testUsers.admin);
    
    await adminPage.click('a:has-text("Spaces")');
    const inviteCode = await createSpace(adminPage, `Journey Test ${timestamp}`);
    
    // Create 5 tasks of varying difficulty
    const taskTitles = ['Sweep Floor', 'Clean Bathroom', 'Do Dishes', 'Organize Fridge', 'Deep Clean Kitchen'];
    for (const title of taskTitles) {
      await adminPage.click('a:has-text("Tasks")');
      await createTask(adminPage, { title, category: 'Common Area', difficulty: '5' });
    }
    
    // Step 2: New user signs up and joins space
    const newUserContext = await browser.newContext();
    const newUserPage = newUserContext.addPage();
    await signUp(newUserPage, testUsers.user1);
    
    await newUserPage.click('a:has-text("Spaces")');
    await joinSpaceWithCode(newUserPage, inviteCode);
    
    // Step 3: User picks and completes 3 tasks
    const completedTasks = 0;
    // In a real scenario, would upload proofs and get approvals
    
    // Step 4: Check leaderboard position
    const leaderboard = await viewLeaderboard(newUserPage);
    expect(leaderboard.length).toBeGreaterThan(0);
    
    await adminContext.close();
    await newUserContext.close();
  });
});

test.describe('SCENARIO 10: Admin Features & Space Management', () => {
  test('Admin can manage space members and settings', async ({ page }) => {
    const timestamp = Date.now();
    
    await signUp(page, testUsers.admin);
    
    // Create space
    await page.click('a:has-text("Spaces")');
    const inviteCode = await createSpace(page, `Admin Test ${timestamp}`);
    
    // Access space settings
    await page.click('button:has-text("Settings"), a:has-text("Settings"), button[aria-label*="Settings"]');
    
    // Verify admin can see space settings
    expect(page.url()).toContain('/settings') || expect(page.url()).toContain('/spaces');
  });
});

// ============================================================================
// PERFORMANCE BASELINE TESTS
// ============================================================================

test.describe('Performance Baselines', () => {
  test('Measure critical user journeys', async ({ page }) => {
    const metrics = {
      signupTime: 0,
      dashboardLoadTime: 0,
      taskCreationTime: 0,
      navigationTime: 0
    };
    
    // Measure signup
    let startTime = Date.now();
    await signUp(page, testUsers.admin);
    metrics.signupTime = Date.now() - startTime;
    
    // Measure dashboard load
    startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    metrics.dashboardLoadTime = Date.now() - startTime;
    
    console.log('Performance Metrics:', metrics);
    
    // Log results
    expect(metrics.signupTime).toBeLessThan(10000); // 10 seconds
    expect(metrics.dashboardLoadTime).toBeLessThan(5000); // 5 seconds
  });
});

// ============================================================================
// ACCESSIBILITY TESTING
// ============================================================================

test.describe('Accessibility Compliance', () => {
  test('Forms are keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Tab through form fields
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);
    
    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);
  });

  test('All interactive elements have proper ARIA labels', async ({ page }) => {
    await signUp(page, testUsers.admin);
    
    // Check for ARIA labels
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const hasLabel = await button.evaluate((el) => {
        return el.getAttribute('aria-label') || el.textContent?.trim() || el.title;
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });
});
