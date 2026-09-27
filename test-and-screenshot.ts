import { chromium, devices } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
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

  console.log('Navigating to game...');
  await page.goto('http://localhost:3000/slg-town-builder/');
  
  // Wait for game to load
  await page.waitForTimeout(3000);

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Taking screenshot 1: Initial town...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'initial-town.png'),
    fullPage: false,
  });

  // Click on an empty plot to open build menu
  console.log('Opening build menu...');
  await page.mouse.click(195, 300); // Click on an empty plot
  await page.waitForTimeout(500);

  console.log('Taking screenshot 2: Build menu open...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'build-menu-open.png'),
    fullPage: false,
  });

  // Close the menu by clicking outside or pressing close
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Click on HQ building
  console.log('Opening HQ info panel...');
  const hqX = 195; // Center of screen where HQ should be
  const hqY = 422;
  await page.mouse.click(hqX, hqY);
  await page.waitForTimeout(500);

  console.log('Taking screenshot 3: HQ upgrade panel...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'hq-upgrade-panel.png'),
    fullPage: false,
  });

  // Close HQ panel
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Build a farm
  console.log('Building a farm...');
  await page.mouse.click(150, 250); // Click empty plot
  await page.waitForTimeout(500);
  
  // Click on farm in build menu (should be first option)
  await page.mouse.click(195, 270);
  await page.waitForTimeout(1000);

  // Build a lumber mill
  console.log('Building a lumber mill...');
  await page.mouse.click(240, 250); // Click another empty plot
  await page.waitForTimeout(500);
  
  // Click on lumber mill in build menu (second option)
  await page.mouse.click(195, 340);
  await page.waitForTimeout(1000);

  console.log('Taking screenshot 4: Town with buildings...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'town-with-buildings.png'),
    fullPage: false,
  });

  // Perform additional playthrough checks
  console.log('Testing quest panel...');
  await page.mouse.click(97, 804); // Quest button at bottom left
  await page.waitForTimeout(500);
  
  // Close quest panel
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Test clicking on a building to collect resources
  console.log('Testing building interaction...');
  await page.mouse.click(150, 250); // Click on farm
  await page.waitForTimeout(500);
  
  // Close panel
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Test settings panel
  console.log('Testing settings panel...');
  await page.mouse.click(292, 804); // Settings button at bottom right
  await page.waitForTimeout(500);
  
  // Close settings
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Reload page to test persistence
  console.log('Testing save/reload...');
  await page.reload();
  await page.waitForTimeout(2000);

  console.log('\n=== Test Results ===');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Console Error Details:');
    consoleErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log(`\nPage Errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    console.log('Page Error Details:');
    pageErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('\nScreenshots saved to:');
  console.log('  - screenshots/initial-town.png');
  console.log('  - screenshots/build-menu-open.png');
  console.log('  - screenshots/hq-upgrade-panel.png');
  console.log('  - screenshots/town-with-buildings.png');

  await browser.close();

  // Return error count for script exit code
  const totalErrors = consoleErrors.length + pageErrors.length;
  console.log(`\nTotal Errors: ${totalErrors}`);
  
  // Write results to file
  fs.writeFileSync(
    path.join(screenshotsDir, 'test-results.json'),
    JSON.stringify({
      consoleErrors,
      pageErrors,
      totalErrors,
      timestamp: new Date().toISOString(),
    }, null, 2)
  );

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
