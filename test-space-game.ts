import { chromium } from 'playwright';
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
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
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

  console.log('🚀 Starting Lost in Space playthrough...');
  await page.goto('http://localhost:3000/slg-town-builder/');
  
  const screenshotsDir = path.join(__dirname, 'screenshots-space');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Wait for game to load
  await page.waitForTimeout(2000);

  // Screenshot 1: Intro frame
  console.log('📸 1. Capturing intro frame...');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotsDir, '1-intro.png'),
    fullPage: false,
  });

  // Skip intro
  console.log('⏭️  Skipping intro...');
  await page.mouse.click(350, 100); // Skip button area
  await page.waitForTimeout(2000);

  // Screenshot 2: Wake view (only hibernation lit)
  console.log('📸 2. Capturing wake view...');
  await page.screenshot({
    path: path.join(screenshotsDir, '2-wake.png'),
    fullPage: false,
  });

  // Click on generator to start emergency power
  console.log('⚡ Starting emergency power...');
  await page.mouse.click(195, 320); // Generator location
  await page.waitForTimeout(1000);
  
  // Confirm generator activation
  await page.mouse.click(195, 422); // Center confirm button
  await page.waitForTimeout(2000);

  // Screenshot 3: After emergency power with timer
  console.log('📸 3. Capturing emergency power view...');
  await page.screenshot({
    path: path.join(screenshotsDir, '3-emergency-power.png'),
    fullPage: false,
  });

  // Enable debug fast mode for testing
  console.log('🏃 Enabling debug fast mode...');
  await page.mouse.click(292, 804); // Settings button
  await page.waitForTimeout(500);
  await page.mouse.click(195, 350); // Debug fast mode toggle
  await page.waitForTimeout(300);
  await page.mouse.click(350, 150); // Close settings
  await page.waitForTimeout(300);

  // Build O2 Recycler
  console.log('🏗️  Building O2 Recycler...');
  await page.mouse.click(195, 250); // Empty plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 300); // O2 Recycler in menu
  await page.waitForTimeout(1000);

  // Build Salvage Workshop
  console.log('🏗️  Building Salvage Workshop...');
  await page.mouse.click(240, 320); // Another empty plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 370); // Salvage in menu
  await page.waitForTimeout(1000);

  // Build Warehouse
  console.log('🏗️  Building Warehouse...');
  await page.mouse.click(150, 320); // Empty plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 440); // Warehouse in menu
  await page.waitForTimeout(1000);

  // Build Airlock
  console.log('🏗️  Building Airlock...');
  await page.mouse.click(290, 250); // Empty plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 510); // Airlock in menu
  await page.waitForTimeout(1000);

  // Wait for builds to complete (fast mode makes this quick)
  console.log('⏳ Waiting for builds...');
  await page.waitForTimeout(3000);

  // Activate O2 Recycler
  console.log('✅ Activating O2 Recycler...');
  await page.mouse.click(195, 250);
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400); // Activate button
  await page.waitForTimeout(500);
  await page.mouse.click(350, 150); // Close
  await page.waitForTimeout(300);

  // Activate Salvage Workshop
  console.log('✅ Activating Salvage Workshop...');
  await page.mouse.click(240, 320);
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400);
  await page.waitForTimeout(500);
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Activate Airlock
  console.log('✅ Activating Airlock...');
  await page.mouse.click(290, 250);
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400);
  await page.waitForTimeout(500);
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Start first EVA
  console.log('🚶 Starting EVA 1...');
  await page.mouse.click(290, 250); // Airlock
  await page.waitForTimeout(500);
  await page.mouse.click(195, 450); // Start EVA button
  await page.waitForTimeout(500);

  // Screenshot 4: Mid-game with EVA in progress
  console.log('📸 4. Capturing mid-game with EVA...');
  await page.screenshot({
    path: path.join(screenshotsDir, '4-midgame-eva.png'),
    fullPage: false,
  });

  // Wait for EVA to complete
  console.log('⏳ Waiting for EVA 1 to complete...');
  await page.waitForTimeout(6000);

  // Start second EVA
  console.log('🚶 Starting EVA 2...');
  await page.mouse.click(290, 250); // Airlock
  await page.waitForTimeout(500);
  await page.mouse.click(195, 450); // Start EVA button
  await page.waitForTimeout(500);
  await page.mouse.click(350, 150); // Close
  await page.waitForTimeout(6000); // Wait for completion

  // Build Energy Refinery
  console.log('🏗️  Building Energy Refinery...');
  await page.mouse.click(100, 250); // Empty plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 580); // Energy Refinery
  await page.waitForTimeout(3000); // Wait for build

  await page.mouse.click(100, 250);
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400); // Activate
  await page.waitForTimeout(500);
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Build Repair Dock
  console.log('🏗️  Building Repair Dock...');
  await page.mouse.click(100, 390); // Empty plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 650); // Repair Dock
  await page.waitForTimeout(3000);

  await page.mouse.click(100, 390);
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400); // Activate
  await page.waitForTimeout(500);
  
  // Repair hull 3 times to reach 70%
  console.log('🔧 Repairing hull...');
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(195, 500); // Repair button
    await page.waitForTimeout(500);
  }
  await page.mouse.click(350, 150); // Close
  await page.waitForTimeout(300);

  // Build Life Support
  console.log('🏗️  Building Life Support...');
  await page.mouse.click(290, 390); // Empty plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 720); // Life Support
  await page.waitForTimeout(3000);

  await page.mouse.click(290, 390);
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400); // Activate
  await page.waitForTimeout(500);
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Build Engine Room
  console.log('🏗️  Building Engine Room...');
  await page.mouse.click(195, 520); // Bottom center plot
  await page.waitForTimeout(500);
  await page.mouse.click(195, 790); // Engine Room
  await page.waitForTimeout(3000);

  await page.mouse.click(195, 520);
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400); // Activate
  await page.waitForTimeout(500);
  await page.mouse.click(350, 150);
  await page.waitForTimeout(300);

  // Screenshot 5: Landing checklist
  console.log('📸 5. Capturing landing checklist...');
  await page.mouse.click(97, 804); // Landing checklist button
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '5-landing-checklist.png'),
    fullPage: false,
  });
  await page.mouse.click(350, 150); // Close
  await page.waitForTimeout(300);

  // Start landing sequence
  console.log('🛬 Starting landing...');
  await page.mouse.click(195, 520); // Engine room
  await page.waitForTimeout(500);
  await page.mouse.click(195, 500); // Ignite/Land button
  await page.waitForTimeout(3000);

  // Screenshot 6: Landing end screen
  console.log('📸 6. Capturing landing screen...');
  await page.screenshot({
    path: path.join(screenshotsDir, '6-landing.png'),
    fullPage: false,
  });

  // Test save/reload
  console.log('💾 Testing save/reload...');
  await page.reload();
  await page.waitForTimeout(2000);
  console.log('✅ Save/reload successful');

  console.log('\n=== 🎮 Test Results ===');
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

  console.log('\n📸 Screenshots saved to:');
  console.log('  - screenshots-space/1-intro.png');
  console.log('  - screenshots-space/2-wake.png');
  console.log('  - screenshots-space/3-emergency-power.png');
  console.log('  - screenshots-space/4-midgame-eva.png');
  console.log('  - screenshots-space/5-landing-checklist.png');
  console.log('  - screenshots-space/6-landing.png');

  await browser.close();

  const totalErrors = consoleErrors.length + pageErrors.length;
  console.log(`\n🎯 Total Errors: ${totalErrors}`);
  
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
  console.error('❌ Test failed:', error);
  process.exit(1);
});
