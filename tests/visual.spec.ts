import { test, expect } from '@playwright/test';

// ============================================
// Visual Regression Tests
// Screenshots comparison for UI consistency
// ============================================

test.describe('Visual Regression Tests', () => {
  
  // ============================================
  // 1. Landing Page Screenshots
  // ============================================
  test.describe('Landing Page', () => {
    
    test('Desktop View', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('landing-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1, // Allow 10% difference
      });
    });

    test('Tablet View', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('landing-tablet.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Mobile View', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('landing-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });
  });

  // ============================================
  // 2. Login Page Screenshots
  // ============================================
  test.describe('Login Page', () => {
    
    test('Desktop - Empty State', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('login-desktop-empty.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Desktop - With Data', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      await expect(page).toHaveScreenshot('login-desktop-filled.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Desktop - Validation Errors', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('login-desktop-errors.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Mobile View', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('login-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });
  });

  // ============================================
  // 3. Register Page Screenshots
  // ============================================
  test.describe('Register Page', () => {
    
    test('Customer Tab', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('register-customer-tab.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Company Tab', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
      
      await page.click('button[role="tab"]:has-text("شركة")');
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('register-company-tab.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Mobile - Customer', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('register-mobile-customer.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });
  });

  // ============================================
  // 4. Reset Password Page Screenshots
  // ============================================
  test.describe('Reset Password Page', () => {
    
    test('Desktop View', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/reset-password');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('reset-password-desktop.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Mobile View', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/reset-password');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('reset-password-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });
  });

  // ============================================
  // 5. Component Screenshots
  // ============================================
  test.describe('UI Components', () => {
    
    test('Button States', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      // Screenshot submit button
      const button = page.locator('button[type="submit"]');
      await expect(button).toHaveScreenshot('button-primary.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Input Fields', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      // Screenshot email input
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveScreenshot('input-email.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Form Card', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      // Screenshot the card
      const card = page.locator('[data-slot="card"]').first();
      await expect(card).toHaveScreenshot('card-login.png', {
        maxDiffPixelRatio: 0.1,
      });
    });
  });

  // ============================================
  // 6. Dark Mode (if supported)
  // ============================================
  test.describe('Dark Mode', () => {
    
    test('Login Page - Dark', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('login-dark-mode.png', {
        maxDiffPixelRatio: 0.15, // More tolerance for dark mode
      });
    });

    test('Register Page - Dark', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('register-dark-mode.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
      });
    });
  });

  // ============================================
  // 7. RTL Layout Check
  // ============================================
  test.describe('RTL Layout', () => {
    
    test('Login Page RTL', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      // Check if the page has RTL direction
      const direction = await page.evaluate(() => {
        return getComputedStyle(document.body).direction;
      });
      
      console.log(`Page direction: ${direction}`);
      
      await expect(page).toHaveScreenshot('login-rtl-layout.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('Register Page RTL', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('register-rtl-layout.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      });
    });
  });
});

// ============================================
// 8. Cross-Browser Visual Tests
// ============================================
test.describe('Cross-Browser Consistency', () => {
  
  test('Login Page Consistency', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot(`login-${browserName}.png`, {
      maxDiffPixelRatio: 0.15,
    });
  });
});
