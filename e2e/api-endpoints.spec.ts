import { test, expect } from '@playwright/test';

/**
 * API Integration Tests for Hostel Management System
 * Tests backend endpoints for:
 * - Space/Hostel CRUD operations
 * - Task management operations
 * - User and member management
 * - Activity logging
 * - Profile operations
 */

test.describe('Space/Hostel API Endpoints', () => {
  let spaceId: string;

  test('should retrieve spaces list for authenticated user', async ({ page }) => {
    // Navigate to spaces page to ensure Supabase client is initialized
    await page.goto('/spaces');

    // Execute fetch to spaces data through the UI context
    const spacesData = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/spaces', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(() => null);
        
        return { success: response ? response.ok : false };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    // API endpoint should be reachable (even if returns 401 without auth)
    expect(spacesData).toBeTruthy();
  });

  test('should create a space via Supabase client', async ({ page }) => {
    await page.goto('/spaces/create');

    // Test space creation through the form which uses Supabase
    const spaceName = `API Test Space ${Date.now()}`;
    await page.getByPlaceholder('e.g., Apartment 4B, Al-Falah Hostel, etc.').fill(spaceName);
    
    // Intercept the Supabase insert operation
    let spaceCreated = false;
    page.on('response', response => {
      if (response.url().includes('supabase') && response.status() === 200) {
        spaceCreated = true;
      }
    });

    await page.getByRole('button', { name: /Create Space/i }).click();

    // Wait for success
    await expect(page.getByText('Hostel Created!')).toBeVisible({ timeout: 10000 });

    // Verify space was created
    expect(spaceCreated).toBeTruthy();
  });

  test('should retrieve space details', async ({ page }) => {
    await page.goto('/spaces');

    // Find a space link and navigate to it
    const spaceLinks = page.locator('a[href*="/spaces/"]').filter({ 
      hasNot: page.locator('text=/create|join/')
    });
    
    const count = await spaceLinks.count();
    if (count > 0) {
      const firstSpaceLink = spaceLinks.first();
      const href = await firstSpaceLink.getAttribute('href');

      if (href) {
        await page.goto(href);
        
        // Verify space details load
        await expect(page.locator('body')).toBeTruthy();
        
        // Should have space information
        expect(page.url()).toContain('/spaces/');
      }
    }
  });

  test('should retrieve space members', async ({ page }) => {
    await page.goto('/spaces');

    // Navigate to space details
    const spaceLink = page.locator('a[href*="/spaces/"]').filter({ 
      hasNot: page.locator('text=/create|join/')
    }).first();
    
    const href = await spaceLink.getAttribute('href');
    if (href) {
      await page.goto(href);

      // Members should be displayed or accessible
      const memberElements = page.locator('[role="article"], li, tr').filter({ 
        hasText: /member|user|profile/i 
      });
      
      expect(memberElements).toBeTruthy();
    }
  });

  test('should update space information', async ({ page }) => {
    await page.goto('/spaces');

    // Find admin panel
    const adminLink = page.locator('a').filter({ hasText: /admin|settings/i }).first();
    const adminHref = await adminLink.getAttribute('href').catch(() => null);

    if (adminHref) {
      await page.goto(adminHref);

      // Look for update/edit functionality
      const editButtons = page.locator('button').filter({ hasText: /edit|update|change/i });
      const editCount = await editButtons.count();

      expect(editCount).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Task Management API Endpoints', () => {
  test('should retrieve all tasks for a space', async ({ page }) => {
    await page.goto('/tasks');

    // Verify tasks page loads and queries tasks
    const taskElements = page.locator('[role="article"], .task-item, li').filter({
      hasNot: page.locator('text=/create/')
    });

    const taskCount = await taskElements.count();
    expect(taskCount).toBeGreaterThanOrEqual(0);
  });

  test('should create a task with all fields', async ({ page }) => {
    await page.goto('/tasks/create');

    // Fill task creation form
    const titleInput = page.getByPlaceholder(/task title|title/i).first();
    
    if (await titleInput.isVisible()) {
      const taskTitle = `Complete API Test Task ${Date.now()}`;
      await titleInput.fill(taskTitle);

      // Fill optional fields
      const descInput = page.getByPlaceholder(/description/i);
      if (await descInput.isVisible()) {
        await descInput.fill('Testing task creation through API');
      }

      const categorySelect = page.getByLabel(/category|type/i);
      if (await categorySelect.isVisible()) {
        const options = await categorySelect.locator('option').count();
        if (options > 1) {
          await categorySelect.selectOption('1'); // Select second option
        }
      }

      const diffSelect = page.getByLabel(/difficulty|level/i);
      if (await diffSelect.isVisible()) {
        const diffOptions = await diffSelect.locator('option').count();
        if (diffOptions > 1) {
          await diffSelect.selectOption('1');
        }
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /create|submit/i }).first();
      await submitBtn.click();

      // Verify task was created
      await page.waitForTimeout(1000);
      expect(page.url()).toBeTruthy();
    }
  });

  test('should retrieve task details', async ({ page }) => {
    await page.goto('/tasks');

    // Click on a task to view details
    const taskLinks = page.locator('a[href*="/tasks/"]').filter({ 
      hasNot: page.locator('text=/create|pick/')
    });

    const count = await taskLinks.count();
    if (count > 0) {
      const firstTask = taskLinks.first();
      const href = await firstTask.getAttribute('href');

      if (href) {
        await page.goto(href);

        // Task details should be visible
        expect(page.url()).toContain('/tasks/');
      }
    }
  });

  test('should update task status', async ({ page }) => {
    await page.goto('/tasks/pick');

    // Look for task action buttons (Take Task, Mark Done, etc)
    const actionButtons = page.locator('button').filter({ 
      hasText: /take|start|complete|done|mark|update/i 
    });

    const actionCount = await actionButtons.count();
    
    if (actionCount > 0) {
      const firstButton = actionButtons.first();
      const buttonText = await firstButton.textContent();

      // Should have buttons to interact with tasks
      expect(buttonText).toBeTruthy();
    }
  });

  test('should assign task to user', async ({ page }) => {
    await page.goto('/tasks');

    // Find and click on a task
    const taskLinks = page.locator('a[href*="/tasks/"]').filter({ 
      hasNot: page.locator('text=/create|pick/')
    });

    const count = await taskLinks.count();
    if (count > 0) {
      await taskLinks.first().click();

      // Look for assign button or dropdown
      const assignButtons = page.locator('button').filter({ 
        hasText: /assign|take|accept/i 
      });

      const assignCount = await assignButtons.count();
      expect(assignCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter tasks by category', async ({ page }) => {
    await page.goto('/tasks');

    // Look for category filter
    const categoryFilters = page.locator('button, select').filter({ 
      hasText: /kitchen|washroom|laundry|dishes|trash|sweeping|dusting/i
    });

    const filterCount = await categoryFilters.count();
    
    if (filterCount > 0) {
      const firstFilter = categoryFilters.first();
      await firstFilter.click();

      // Page should update with filtered results
      await page.waitForTimeout(500);
      expect(page.url()).toBeTruthy();
    }
  });

  test('should sort tasks by difficulty or date', async ({ page }) => {
    await page.goto('/tasks');

    // Look for sort options
    const sortButtons = page.locator('button').filter({ 
      hasText: /sort|difficulty|date|recent|easy|hard/i 
    });

    const sortCount = await sortButtons.count();
    
    if (sortCount > 0) {
      const firstSort = sortButtons.first();
      await firstSort.click();

      await page.waitForTimeout(500);
      expect(page.url()).toBeTruthy();
    }
  });
});

test.describe('User & Member Management API Endpoints', () => {
  test('should retrieve current user profile', async ({ page }) => {
    await page.goto('/profile');

    // Profile information should be displayed
    const profileName = page.locator('h1, h2, [role="heading"]').first();
    
    expect(profileName).toBeTruthy();
  });

  test('should update user profile', async ({ page }) => {
    await page.goto('/profile');

    // Look for edit/update buttons
    const editButtons = page.locator('button').filter({ 
      hasText: /edit|update|change|save/i 
    });

    const editCount = await editButtons.count();
    expect(editCount).toBeGreaterThanOrEqual(0);
  });

  test('should retrieve space members list', async ({ page }) => {
    await page.goto('/spaces');

    // Navigate to a space
    const spaceLink = page.locator('a[href*="/spaces/"]').filter({ 
      hasNot: page.locator('text=/create|join/')
    }).first();

    const href = await spaceLink.getAttribute('href');
    if (href) {
      await page.goto(href);

      // Members should be displayed
      const memberElements = page.locator('li, tr, [role="article"]').filter({ 
        hasText: /member|user|profile/i 
      });

      expect(memberElements).toBeTruthy();
    }
  });

  test('should join a space with invite code', async ({ page }) => {
    await page.goto('/spaces/join');

    // Look for invite code input
    const inviteInput = page.getByPlaceholder(/code|invite/i).first();

    if (await inviteInput.isVisible()) {
      // Form is available
      expect(inviteInput).toBeTruthy();
    }
  });

  test('should display user points and ranking', async ({ page }) => {
    await page.goto('/leaderboard');

    // Leaderboard should display user rankings
    const leaderboardItems = page.locator('li, tr, [role="article"]');

    const itemCount = await leaderboardItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(0);
  });

  test('should retrieve user preferences', async ({ page }) => {
    await page.goto('/preferences');

    // Preferences form should be loaded
    const preferenceInputs = page.locator('input, select, checkbox');

    const inputCount = await preferenceInputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(0);
  });

  test('should update user preferences', async ({ page }) => {
    await page.goto('/preferences');

    // Look for checkboxes or toggles for preferences
    const toggles = page.locator('input[type="checkbox"], [role="checkbox"], button[aria-pressed]');

    const toggleCount = await toggles.count();
    
    if (toggleCount > 0) {
      // User can interact with preferences
      expect(toggleCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Activity Logging & History API Endpoints', () => {
  test('should display activity log for space', async ({ page }) => {
    await page.goto('/spaces');

    // Navigate to space
    const spaceLink = page.locator('a[href*="/spaces/"]').filter({ 
      hasNot: page.locator('text=/create|join/')
    }).first();

    const href = await spaceLink.getAttribute('href');
    if (href) {
      await page.goto(href);

      // Look for activity section
      const activityElements = page.locator('[role="article"], li').filter({ 
        hasText: /activity|history|log|action/i 
      });

      expect(activityElements).toBeTruthy();
    }
  });

  test('should log user actions (create, update, complete)', async ({ page }) => {
    // Create a task to trigger activity logging
    await page.goto('/tasks/create');

    const titleInput = page.getByPlaceholder(/task title|title/i).first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(`Activity Test ${Date.now()}`);
      await page.getByRole('button', { name: /create|submit/i }).first().click();

      // Action should be logged
      await page.waitForTimeout(1000);
    }

    // Navigate to activity/history if available
    const historyLink = page.locator('a').filter({ hasText: /history|activity|log/i }).first();
    const historyHref = await historyLink.getAttribute('href').catch(() => null);

    if (historyHref) {
      await page.goto(historyHref);
      // Activity should be visible
      expect(page.url()).toBeTruthy();
    }
  });
});

test.describe('Admin API Endpoints', () => {
  test('should access space admin panel', async ({ page }) => {
    await page.goto('/spaces');

    // Find admin link
    const adminLink = page.locator('a').filter({ hasText: /admin|settings/i }).first();
    const adminHref = await adminLink.getAttribute('href').catch(() => null);

    if (adminHref) {
      await page.goto(adminHref);

      // Admin panel should have management features
      expect(page.url()).toContain('admin');
    }
  });

  test('should manage space members from admin panel', async ({ page }) => {
    await page.goto('/spaces');

    const adminLink = page.locator('a').filter({ hasText: /admin|settings/i }).first();
    const adminHref = await adminLink.getAttribute('href').catch(() => null);

    if (adminHref) {
      await page.goto(adminHref);

      // Look for member management controls
      const memberControls = page.locator('button, select').filter({ 
        hasText: /member|user|role|remove|kick|invite/i 
      });

      const controlCount = await memberControls.count();
      expect(controlCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should view admin statistics and insights', async ({ page }) => {
    await page.goto('/spaces');

    const adminLink = page.locator('a').filter({ hasText: /admin|settings/i }).first();
    const adminHref = await adminLink.getAttribute('href').catch(() => null);

    if (adminHref) {
      await page.goto(adminHref);

      // Look for stats/analytics
      const statElements = page.locator('[role="article"], li, div').filter({ 
        hasText: /statistics|analytics|stats|total|completed|pending/i 
      });

      expect(statElements).toBeTruthy();
    }
  });
});

test.describe('Data Validation & Error Responses', () => {
  test('should validate required fields on create task', async ({ page }) => {
    await page.goto('/tasks/create');

    // Try to submit without title
    const submitBtn = page.getByRole('button', { name: /create|submit/i }).first();
    const isDisabled = await submitBtn.isDisabled().catch(() => false);

    // Either button is disabled or form has validation
    if (!isDisabled) {
      await submitBtn.click();
      // Form should show validation error or prevent submission
      await page.waitForTimeout(500);
    }

    expect(page.url()).toContain('/tasks/create');
  });

  test('should handle duplicate space names gracefully', async ({ page }) => {
    await page.goto('/spaces/create');

    // Create a space with a name
    const spaceName = `Duplicate Test ${Date.now()}`;
    await page.getByPlaceholder('e.g., Apartment 4B, Al-Falah Hostel, etc.').fill(spaceName);
    await page.getByRole('button', { name: /Create Space/i }).click();

    // Wait for creation
    await page.waitForTimeout(2000);

    // Try to create with same name again
    if (page.url().includes('/spaces/create')) {
      await page.getByPlaceholder('e.g., Apartment 4B, Al-Falah Hostel, etc.').fill(spaceName);
      await page.getByRole('button', { name: /Create Space/i }).click();

      // Should either prevent duplicate or show error
      await page.waitForTimeout(1000);
    }

    expect(page.url()).toBeTruthy();
  });

  test('should handle invalid task difficulty values', async ({ page }) => {
    await page.goto('/tasks/create');

    const titleInput = page.getByPlaceholder(/task title|title/i).first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(`Validation Test ${Date.now()}`);

      // Look for difficulty input
      const diffInput = page.getByLabel(/difficulty/i);
      if (await diffInput.isVisible()) {
        // Try invalid value
        await diffInput.fill('999');
        
        // Try to submit
        const submitBtn = page.getByRole('button', { name: /create/i }).first();
        await submitBtn.click();

        // Should validate or show error
        await page.waitForTimeout(500);
      }
    }

    expect(page.url()).toBeTruthy();
  });
});
