/**
 * Authentication Setup for E2E Tests
 * This file contains helper functions for authentication in E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Login helper function
 * Note: This is a simplified version. You may need to adjust based on your actual login flow.
 */
export async function login(page: Page, email: string) {
  // Navigate to login page
  await page.goto('/login');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Fill in email (adjust selector based on your actual form)
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(email);

    // Submit the form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // For magic link authentication, you might need to handle verification differently
    // This is a placeholder - adjust based on your actual auth flow
    console.log(`Login initiated for ${email}`);
  }
}

/**
 * Check if user is logged in by looking for common authenticated elements
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for elements that only appear when logged in
    // Adjust these selectors based on your actual application
    await page.waitForSelector('text=ダッシュボード', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout = 10000) {
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout });
}
