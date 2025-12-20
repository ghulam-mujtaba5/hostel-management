import { Page, expect } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

// Generate unique test data
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export function generateUsername(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function generateSpaceName(): string {
  return `Space_${Date.now()}`;
}

// Navigation helpers
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

// Authentication helpers
export async function signUp(page: Page, email: string, password: string, username: string) {
  await navigateTo(page, '/login');
  
  // Click Sign up button to switch to signup mode
  await page.getByRole('button', { name: 'Sign up' }).click();
  
  // Fill in signup form
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByPlaceholder('Your name').fill(username);
  
  // Submit
  await page.getByRole('button', { name: 'Sign Up' }).click();
  
  // Wait for navigation
  await page.waitForURL('**/', { timeout: 10000 });
}

export async function signIn(page: Page, email: string, password: string) {
  await navigateTo(page, '/login');
  
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for redirect to home
  await page.waitForURL('**/', { timeout: 10000 });
}

export async function signOut(page: Page) {
  // Click profile or menu button
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  
  // Wait for redirect to login
  await page.waitForURL('**/login', { timeout: 10000 });
}

// Space helpers
export async function createSpace(page: Page, spaceName: string) {
  // Navigate to spaces
  await page.getByRole('link', { name: 'Spaces' }).click();
  
  // Click create
  await page.getByRole('link', { name: 'Create Space' }).click();
  
  // Fill form
  await page.getByLabel('Space Name').fill(spaceName);
  
  // Submit
  await page.getByRole('button', { name: 'Create Space' }).click();
  
  // Wait for redirect
  await page.waitForURL('**/spaces', { timeout: 10000 });
}

export async function joinSpace(page: Page, inviteCode: string) {
  await page.getByRole('link', { name: 'Spaces' }).click();
  await page.getByRole('link', { name: 'Join Space' }).click();
  
  await page.getByLabel('Invite Code').fill(inviteCode);
  await page.getByRole('button', { name: 'Join Space' }).click();
  
  await page.waitForURL('**/spaces', { timeout: 10000 });
}

// Task helpers
export async function createTask(page: Page, taskData: {
  title: string;
  description?: string;
  category?: string;
  difficulty?: number;
}) {
  await page.getByRole('link', { name: 'Tasks' }).click();
  await page.getByRole('link', { name: 'New Task' }).click();
  
  await page.getByLabel('Title').fill(taskData.title);
  
  if (taskData.description) {
    await page.getByLabel('Description').fill(taskData.description);
  }
  
  if (taskData.category) {
    await page.getByLabel('Category').selectOption(taskData.category);
  }
  
  if (taskData.difficulty) {
    await page.getByLabel('Difficulty').fill(taskData.difficulty.toString());
  }
  
  await page.getByRole('button', { name: 'Create Task' }).click();
  
  await page.waitForURL('**/tasks', { timeout: 10000 });
}

export async function pickTask(page: Page, taskTitle: string) {
  // Navigate to task pick page
  await page.getByRole('link', { name: 'Pick a Task' }).click();
  
  // Find and click on the task
  const taskCard = page.getByText(taskTitle).first();
  await taskCard.click();
  
  // Click "Take This Task" button
  await page.getByRole('button', { name: 'Take This Task' }).click();
  
  // Wait for confirmation
  await expect(page.getByText(/taken|started/i)).toBeVisible();
}

// Assertion helpers
export async function expectToBeOnPage(page: Page, urlPattern: string) {
  await expect(page).toHaveURL(new RegExp(urlPattern));
}

export async function expectElementVisible(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible();
}

export async function expectElementNotVisible(page: Page, text: string) {
  await expect(page.getByText(text)).not.toBeVisible();
}

// Wait helpers
export async function waitForToast(page: Page, message: string) {
  await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
}

export async function waitForNavigation(page: Page) {
  await page.waitForLoadState('networkidle');
}
