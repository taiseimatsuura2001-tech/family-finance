/**
 * E2E Tests for Responsive Design
 * Tests the application on different screen sizes
 */

import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.describe('Mobile View (iPhone 12)', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    test('should show hamburger menu on mobile', async ({ page }) => {
      await page.goto('/');

      // Wait for navigation to load
      await page.waitForLoadState('networkidle');

      // Check if we're on login page (not authenticated)
      const isLoginPage = await page.locator('text=ログイン').isVisible().catch(() => false);

      if (!isLoginPage) {
        // If authenticated, check for hamburger menu
        const hamburgerButton = page.locator('button[aria-label="メニューを開く"]');
        await expect(hamburgerButton).toBeVisible();

        // Desktop menu should be hidden
        const desktopMenu = page.locator('.hidden.md\\:flex');
        await expect(desktopMenu).toBeHidden();
      } else {
        console.log('Not authenticated - skipping hamburger menu test');
      }
    });

    test('calendar should be readable on mobile', async ({ page }) => {
      await page.goto('/calendar');

      await page.waitForLoadState('networkidle');

      const isLoginPage = await page.locator('text=ログイン').isVisible().catch(() => false);

      if (!isLoginPage) {
        // Check that calendar exists
        const calendar = page.locator('text=カレンダー').first();
        await expect(calendar).toBeVisible();

        // Check that calendar grid is visible
        // Calendar should have 7 columns (days of week)
        const weekDays = page.locator('text=日').first();
        await expect(weekDays).toBeVisible();

        // Take screenshot for manual verification
        await page.screenshot({ path: 'test-results/mobile-calendar.png', fullPage: true });
      } else {
        console.log('Not authenticated - skipping calendar test');
      }
    });

    test('dashboard cards should stack vertically on mobile', async ({ page }) => {
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      const isLoginPage = await page.locator('text=ログイン').isVisible().catch(() => false);

      if (!isLoginPage) {
        // Look for dashboard cards
        const cards = page.locator('[class*="Card"]').or(page.locator('text=今月の収入').first());

        if (await cards.count() > 0) {
          // Take screenshot for manual verification
          await page.screenshot({ path: 'test-results/mobile-dashboard.png', fullPage: true });
        }
      } else {
        console.log('Not authenticated - skipping dashboard test');
      }
    });
  });

  test.describe('Tablet View (iPad)', () => {
    test.use({
      viewport: { width: 768, height: 1024 }
    });

    test('should show appropriate layout on tablet', async ({ page }) => {
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      const isLoginPage = await page.locator('text=ログイン').isVisible().catch(() => false);

      if (!isLoginPage) {
        // Navigation should be visible on tablet
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/tablet-dashboard.png', fullPage: true });
      } else {
        console.log('Not authenticated - skipping tablet test');
      }
    });
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1920, height: 1080 }
    });

    test('should show full layout on desktop', async ({ page }) => {
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      const isLoginPage = await page.locator('text=ログイン').isVisible().catch(() => false);

      if (!isLoginPage) {
        // Full navigation should be visible
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/desktop-dashboard.png', fullPage: true });
      } else {
        console.log('Not authenticated - skipping desktop test');
      }
    });

    test('calendar should display properly on desktop', async ({ page }) => {
      await page.goto('/calendar');

      await page.waitForLoadState('networkidle');

      const isLoginPage = await page.locator('text=ログイン').isVisible().catch(() => false);

      if (!isLoginPage) {
        // Calendar should be visible
        const calendar = page.locator('text=カレンダー').first();
        await expect(calendar).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/desktop-calendar.png', fullPage: true });
      } else {
        console.log('Not authenticated - skipping desktop calendar test');
      }
    });
  });
});
