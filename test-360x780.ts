import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  console.log('Testing at 360x780...');
  await page.goto('http://localhost:3000/slg-town-builder/');
  
  await page.waitForTimeout(3000);

  const screenshotsDir = path.join(__dirname, 'screenshots');
  
  console.log('Taking verification screenshot at 360x780...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'test-360x780.png'),
    fullPage: false,
  });

  // Test basic interactions
  await page.mouse.click(180, 300);
  await page.waitForTimeout(500);
  
  await page.mouse.click(300, 150);
  await page.waitForTimeout(300);

  console.log('\n=== 360x780 Test Results ===');
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Page Errors: ${pageErrors.length}`);
  console.log(`Total Errors: ${consoleErrors.length + pageErrors.length}`);

  await browser.close();

  process.exit((consoleErrors.length + pageErrors.length) > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
