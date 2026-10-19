import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const outputDir = path.resolve(process.cwd(), 'docs', 'screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capture() {
  const prefix = process.argv[2] || 'phase3';
  const url = process.argv[3] || 'http://localhost:5173/';

  console.log(`Launching browser: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument((targetUrl) => {
    localStorage.setItem('has_seen_onboarding', 'true');
    if (targetUrl.includes('/admin')) {
      const adminState = {
        state: {
          profile: {
            id: 'admin-0000-0000-0000-000000000001',
            full_name: 'Quản Trị Viên An Toàn',
            role: 'admin',
            is_locked: false,
            daily_quota: 100,
            parental_pin_hash: '1234',
          },
          childrenList: [],
          selectedChildId: null,
        },
        version: 0,
      };
      localStorage.setItem('drawtostory-auth-storage', JSON.stringify(adminState));
    }
  }, url);

  // Desktop 1440px
  console.log(`Navigating to ${url} at 1440x900...`);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1000));
  const desktopPath = path.join(outputDir, `${prefix}_desktop_1440.png`);
  await page.screenshot({ path: desktopPath, fullPage: false });
  console.log(`Saved desktop screenshot: ${desktopPath}`);

  // Mobile 390px (iPhone 12/13/14)
  console.log(`Navigating to ${url} at 390x844...`);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const mobilePath = path.join(outputDir, `${prefix}_mobile_390.png`);
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log(`Saved mobile screenshot: ${mobilePath}`);

  await browser.close();
  console.log('Capture finished successfully.');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
