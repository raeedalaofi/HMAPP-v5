import { test, expect, Page } from '@playwright/test';

// ============================================
// Load & Stress Tests
// Performance under pressure
// ============================================

test.describe('Load & Stress Tests', () => {
  
  // ============================================
  // 1. Page Load Performance Tests
  // ============================================
  test.describe('Page Load Performance', () => {
    
    test('Landing Page - Load Time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      console.log(`Landing Page Load Time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
      
      // Measure First Contentful Paint
      const fcp = await page.evaluate(() => {
        const entry = performance.getEntriesByName('first-contentful-paint')[0];
        return entry ? entry.startTime : null;
      });
      
      console.log(`First Contentful Paint: ${fcp}ms`);
      
      // Measure Largest Contentful Paint
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            resolve(entries[entries.length - 1]?.startTime || null);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          setTimeout(() => resolve(null), 5000);
        });
      });
      
      console.log(`Largest Contentful Paint: ${lcp}ms`);
      console.log('✅ Landing Page Performance: PASSED');
    });

    test('Login Page - Load Time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      console.log(`Login Page Load Time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(2000);
      
      console.log('✅ Login Page Performance: PASSED');
    });

    test('Register Page - Load Time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      console.log(`Register Page Load Time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(2000);
      
      console.log('✅ Register Page Performance: PASSED');
    });
  });

  // ============================================
  // 2. Concurrent Users Simulation
  // ============================================
  test.describe('Concurrent Users', () => {
    
    test('5 Concurrent Page Loads', async ({ browser }) => {
      const startTime = Date.now();
      
      // Create 5 concurrent contexts
      const contexts = await Promise.all(
        Array(5).fill(null).map(() => browser.newContext())
      );
      
      const pages = await Promise.all(
        contexts.map(ctx => ctx.newPage())
      );
      
      // Load pages concurrently
      const results = await Promise.all(
        pages.map(async (page, index) => {
          const start = Date.now();
          await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
          return { index, time: Date.now() - start };
        })
      );
      
      const totalTime = Date.now() - startTime;
      
      console.log('Concurrent Load Results:');
      results.forEach(r => console.log(`  Page ${r.index + 1}: ${r.time}ms`));
      console.log(`Total time for 5 concurrent loads: ${totalTime}ms`);
      
      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()));
      
      // Average should be reasonable
      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      console.log(`Average load time: ${avgTime}ms`);
      expect(avgTime).toBeLessThan(5000);
      
      console.log('✅ Concurrent Users Test: PASSED');
    });

    test('10 Sequential Page Loads', async ({ page }) => {
      const times: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
        times.push(Date.now() - start);
      }
      
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      console.log(`10 Sequential Loads:`);
      console.log(`  Average: ${avg.toFixed(0)}ms`);
      console.log(`  Min: ${min}ms`);
      console.log(`  Max: ${max}ms`);
      
      expect(avg).toBeLessThan(2000);
      
      console.log('✅ Sequential Loads Test: PASSED');
    });
  });

  // ============================================
  // 3. Form Submission Stress Test
  // ============================================
  test.describe('Form Submission Stress', () => {
    
    test('Rapid Form Submissions', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      const submissionTimes: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        await page.fill('input[name="email"]', `test${i}@example.com`);
        await page.fill('input[name="password"]', 'Password123!');
        
        const start = Date.now();
        await page.click('button[type="submit"]');
        
        // Wait for response (toast or navigation)
        await page.waitForTimeout(1000);
        submissionTimes.push(Date.now() - start);
        
        // Clear for next submission
        await page.fill('input[name="email"]', '');
        await page.fill('input[name="password"]', '');
      }
      
      const avg = submissionTimes.reduce((a, b) => a + b, 0) / submissionTimes.length;
      console.log(`Rapid Form Submissions (5x):`);
      console.log(`  Average response time: ${avg.toFixed(0)}ms`);
      
      console.log('✅ Rapid Form Submissions: PASSED');
    });

    test('Form Input Speed Test', async ({ page }) => {
      await page.goto('http://localhost:3000/register?type=customer');
      
      const startTime = Date.now();
      
      // Type rapidly
      await page.fill('input[name="fullName"]', 'Test User Name Here');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '+966501234567');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      
      const fillTime = Date.now() - startTime;
      console.log(`Form fill time: ${fillTime}ms`);
      
      // Should be quick
      expect(fillTime).toBeLessThan(2000);
      
      console.log('✅ Form Input Speed: PASSED');
    });
  });

  // ============================================
  // 4. Memory & Resource Usage
  // ============================================
  test.describe('Memory & Resource Usage', () => {
    
    test('Memory Leak Check - Navigation', async ({ page }) => {
      const pages = ['/login', '/register', '/', '/reset-password'];
      
      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Navigate multiple times
      for (let i = 0; i < 20; i++) {
        const targetPage = pages[i % pages.length];
        await page.goto(`http://localhost:3000${targetPage}`, { waitUntil: 'domcontentloaded' });
      }
      
      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = (memoryIncrease / 1024 / 1024).toFixed(2);
      
      console.log(`Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Memory Increase: ${memoryIncreaseMB} MB`);
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log('✅ Memory Leak Check: PASSED');
    });

    test('DOM Element Count', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      const elementCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      console.log(`DOM Elements on Login Page: ${elementCount}`);
      
      // Should not have excessive DOM elements
      expect(elementCount).toBeLessThan(1000);
      
      console.log('✅ DOM Element Count: PASSED');
    });
  });

  // ============================================
  // 5. Network Performance
  // ============================================
  test.describe('Network Performance', () => {
    
    test('Network Requests Count', async ({ page }) => {
      const requests: string[] = [];
      
      page.on('request', request => {
        requests.push(request.url());
      });
      
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      
      console.log(`Total Network Requests: ${requests.length}`);
      
      // Categorize requests
      const jsRequests = requests.filter(r => r.includes('.js'));
      const cssRequests = requests.filter(r => r.includes('.css'));
      const imageRequests = requests.filter(r => /\.(png|jpg|jpeg|gif|svg|webp)/.test(r));
      const apiRequests = requests.filter(r => r.includes('/api/'));
      
      console.log(`  JS files: ${jsRequests.length}`);
      console.log(`  CSS files: ${cssRequests.length}`);
      console.log(`  Images: ${imageRequests.length}`);
      console.log(`  API calls: ${apiRequests.length}`);
      
      // Should not have excessive requests
      expect(requests.length).toBeLessThan(50);
      
      console.log('✅ Network Requests: PASSED');
    });

    test('Total Page Size', async ({ page }) => {
      let totalSize = 0;
      
      page.on('response', async response => {
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0');
        totalSize += contentLength;
      });
      
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      
      const totalSizeKB = (totalSize / 1024).toFixed(2);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      
      console.log(`Total Page Size: ${totalSizeKB} KB (${totalSizeMB} MB)`);
      
      // Page should be under 5MB
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
      
      console.log('✅ Page Size Check: PASSED');
    });

    test('Slow Network Simulation (3G)', async ({ page }) => {
      // Simulate 3G network
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 100, // 100ms latency
      });
      
      const startTime = Date.now();
      await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;
      
      console.log(`3G Load Time: ${loadTime}ms`);
      
      // Should still load in reasonable time on 3G
      expect(loadTime).toBeLessThan(10000);
      
      console.log('✅ 3G Network Test: PASSED');
    });
  });

  // ============================================
  // 6. Bundle Size Analysis
  // ============================================
  test.describe('Bundle Analysis', () => {
    
    test('JavaScript Bundle Size', async ({ page }) => {
      const jsBundles: { url: string; size: number }[] = [];
      
      page.on('response', async response => {
        const url = response.url();
        if (url.includes('.js') && !url.includes('node_modules')) {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0');
          jsBundles.push({ url, size });
        }
      });
      
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      
      const totalJSSize = jsBundles.reduce((sum, b) => sum + b.size, 0);
      
      console.log(`JavaScript Bundles: ${jsBundles.length}`);
      console.log(`Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB`);
      
      // Show largest bundles
      const sorted = jsBundles.sort((a, b) => b.size - a.size).slice(0, 5);
      console.log('Largest JS bundles:');
      sorted.forEach(b => {
        const name = b.url.split('/').pop();
        console.log(`  ${name}: ${(b.size / 1024).toFixed(2)} KB`);
      });
      
      // Total JS should be under 2MB
      expect(totalJSSize).toBeLessThan(2 * 1024 * 1024);
      
      console.log('✅ Bundle Size Analysis: PASSED');
    });
  });

  // ============================================
  // 7. Animation & Rendering Performance
  // ============================================
  test.describe('Rendering Performance', () => {
    
    test('Tab Switching Performance', async ({ page }) => {
      await page.goto('http://localhost:3000/register');
      
      const times: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const tab = i % 2 === 0 ? 'عميل' : 'شركة';
        
        const start = Date.now();
        await page.click(`button[role="tab"]:has-text("${tab}")`);
        await page.waitForTimeout(100);
        times.push(Date.now() - start);
      }
      
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Tab Switch Average Time: ${avg.toFixed(0)}ms`);
      
      expect(avg).toBeLessThan(500);
      
      console.log('✅ Tab Switching Performance: PASSED');
    });

    test('Input Responsiveness', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      const input = page.locator('input[name="email"]');
      
      const start = Date.now();
      
      // Type character by character
      for (const char of 'test@example.com') {
        await input.type(char, { delay: 0 });
      }
      
      const typeTime = Date.now() - start;
      console.log(`Typing 16 characters took: ${typeTime}ms`);
      
      // Should be responsive (less than 100ms per character)
      expect(typeTime).toBeLessThan(1600);
      
      console.log('✅ Input Responsiveness: PASSED');
    });
  });

  // ============================================
  // 8. Stress Test Summary
  // ============================================
  test('Overall Performance Summary', async ({ page }) => {
    console.log('\n========================================');
    console.log('Performance Test Summary');
    console.log('========================================');
    
    const metrics: { [key: string]: number } = {};
    
    // Landing page
    let start = Date.now();
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    metrics['Landing Page'] = Date.now() - start;
    
    // Login page
    start = Date.now();
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    metrics['Login Page'] = Date.now() - start;
    
    // Register page
    start = Date.now();
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    metrics['Register Page'] = Date.now() - start;
    
    // Memory
    const memory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    metrics['Memory (MB)'] = Math.round(memory / 1024 / 1024);
    
    // DOM elements
    const domCount = await page.evaluate(() => document.querySelectorAll('*').length);
    metrics['DOM Elements'] = domCount;
    
    console.log('\nResults:');
    Object.entries(metrics).forEach(([key, value]) => {
      const unit = key.includes('Page') ? 'ms' : key.includes('MB') ? 'MB' : '';
      console.log(`  ${key}: ${value}${unit}`);
    });
    
    // Pass criteria
    const allPassed = 
      metrics['Landing Page'] < 3000 &&
      metrics['Login Page'] < 2000 &&
      metrics['Register Page'] < 2000 &&
      metrics['Memory (MB)'] < 100 &&
      metrics['DOM Elements'] < 2000;
    
    console.log(`\n${allPassed ? '✅' : '❌'} Overall Performance: ${allPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
    console.log('========================================\n');
    
    expect(allPassed).toBeTruthy();
  });
});
