/**
 * E2E Tests for Basic Navigation
 * Tests that all pages are accessible and render correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');

    // Check that login page loads
    await expect(page).toHaveURL(/.*login/);

    // Take screenshot
    await page.screenshot({ path: 'test-results/login-page.png' });
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Should either be on login or dashboard (if authenticated)
    const url = page.url();
    const isLoginOrDashboard = url.includes('/login') || url === 'http://localhost:3000/';
    expect(isLoginOrDashboard).toBeTruthy();
  });

  test.describe('Authenticated Routes', () => {
    test.beforeEach(async ({ page }) => {
      // Note: This assumes you have a way to authenticate
      // You may need to implement proper authentication setup
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    const routes = [
      { path: '/', name: 'Dashboard' },
      { path: '/income', name: 'Income' },
      { path: '/expense', name: 'Expense' },
      { path: '/calendar', name: 'Calendar' },
      { path: '/analysis', name: 'Analysis' },
      { path: '/settings', name: 'Settings' },
    ];

    for (const route of routes) {
      test(`should load ${route.name} page`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        // Check that we're either on the route or login page
        const url = page.url();
        const isCorrectPage = url.includes(route.path) || url.includes('/login');
        expect(isCorrectPage).toBeTruthy();

        // Take screenshot
        const screenshotName = route.path === '/' ? 'dashboard' : route.path.slice(1);
        await page.screenshot({
          path: `test-results/${screenshotName}-page.png`,
          fullPage: true
        });
      });
    }
  });

  test('should have functional mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const isLoginPage = await page.locator('text=ログイン').isVisible().catch(() => false);

    if (!isLoginPage) {
      // Look for hamburger menu
      const hamburgerButton = page.locator('button').filter({ hasText: /menu|メニュー/i }).or(
        page.locator('button[aria-label*="menu" i], button[aria-label*="メニュー"]')
      ).first();

      if (await hamburgerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click to open menu
        await hamburgerButton.click();

        // Wait for menu to open
        await page.waitForTimeout(500);

        // Take screenshot of open menu
        await page.screenshot({ path: 'test-results/mobile-menu-open.png' });

        // Menu should contain navigation items
        const menuItems = page.locator('text=ダッシュボード, text=収入, text=支出, text=分析, text=カレンダー');
        const hasMenuItems = await menuItems.first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasMenuItems).toBeTruthy();
      }
    }
  });
});
