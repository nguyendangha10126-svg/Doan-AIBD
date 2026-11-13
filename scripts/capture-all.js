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

const routes = [
  { name: 'dashboard', path: '/' },
  { name: 'library', path: '/library' },
  { name: 'create', path: '/create' },
  { name: 'reader', path: '/story/c0000001-0000-0000-0000-000000000001' },
  { name: 'kid', path: '/kid' },
  { name: 'trust', path: '/trust' },
  { name: 'settings', path: '/settings' },
  { name: 'admin_overview', path: '/admin/overview', isAdmin: true },
  { name: 'admin_moderation', path: '/admin/moderation', isAdmin: true },
];

async function captureAll(phase = 'before') {
  const baseUrl = process.argv[3] || 'http://localhost:5173';
  const targetDir = path.join(outputDir, phase);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Starting capture [${phase}] from ${baseUrl} into ${targetDir}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const route of routes) {
    const page = await browser.newPage();

    await page.evaluateOnNewDocument((isAdmin) => {
      localStorage.setItem('has_seen_onboarding', 'true');
      const userState = {
        state: {
          profile: isAdmin
            ? {
                id: 'a0000000-0000-0000-0000-000000000001',
                email: 'admin@drawtostory.vn',
                full_name: 'Quản Trị Viên An Toàn',
                role: 'admin',
                is_locked: false,
                daily_quota: 100,
                parental_pin_hash: '001627dbf308f962',
              }
            : {
                id: 'b0000000-0000-0000-0000-000000000002',
                email: 'me@phuhuynh.vn',
                full_name: 'Mẹ Thu Hà',
                role: 'user',
                is_locked: false,
                daily_quota: 5,
                parental_pin_hash: '001627dbf308f962',
              },
          childrenList: [],
          selectedChildId: null,
        },
        version: 0,
      };
      localStorage.setItem('drawtostory-auth-storage', JSON.stringify(userState));
    }, route.isAdmin);

    const fullUrl = `${baseUrl}${route.path}`;
    console.log(`Capturing ${route.name} at ${fullUrl}...`);

    try {
      // Desktop 1440px
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 25000 });
      await new Promise((r) => setTimeout(r, 800));
      const desktopFile = path.join(targetDir, `${route.name}_desktop_1440.png`);
      await page.screenshot({ path: desktopFile, fullPage: false });
      console.log(`  ✓ Desktop: ${desktopFile}`);

      // Mobile 390px
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
      await new Promise((r) => setTimeout(r, 800));
      const mobileFile = path.join(targetDir, `${route.name}_mobile_390.png`);
      await page.screenshot({ path: mobileFile, fullPage: false });
      console.log(`  ✓ Mobile: ${mobileFile}`);
    } catch (err) {
      console.error(`  ✗ Failed capturing ${route.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`Finished capture for phase: ${phase}`);
}

const phaseArg = process.argv[2] || 'before';
captureAll(phaseArg).catch((e) => {
  console.error(e);
  process.exit(1);
});

