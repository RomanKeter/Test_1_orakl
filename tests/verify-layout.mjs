import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], {
  stdio: 'ignore',
  cwd: process.cwd()
});
let browser;
const failures = [];
try {
  await new Promise(resolve => setTimeout(resolve, 900));
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => failures.push(error.message));

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.screens.ready', { timeout: 30000 });
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll('.screen-art')];
    return images.length === 8 && images.every(img => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 30000 });

  const pageNames = ['home', 'map', 'tarot', 'astrology', 'psychology', 'dreams', 'arena', 'themes'];
  assert.equal(await page.locator('.screen').count(), 8, 'All eight reference screens should exist');
  assert.ok(await page.locator('.hit').count() >= 75, 'Interactive hotspots should be present on all screens');
  await mkdir('test-results', { recursive: true });

  // Desktop: three-column research workspace.
  let layout = await page.evaluate(() => {
    const style = selector => getComputedStyle(document.querySelector(selector));
    const box = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width };
    };
    return {
      navDisplay: style('.desktop-nav').display,
      contextDisplay: style('.context-panel').display,
      columns: style('.workspace').gridTemplateColumns.split(' ').length,
      nav: box('.desktop-nav'),
      device: box('.device'),
      context: box('.context-panel'),
      overflow: document.documentElement.scrollWidth > innerWidth
    };
  });
  assert.notEqual(layout.navDisplay, 'none', 'Desktop navigation should be visible');
  assert.notEqual(layout.contextDisplay, 'none', 'Desktop context panel should be visible');
  assert.ok(layout.columns >= 3, 'Desktop should use three columns');
  assert.ok(layout.nav.right < layout.device.left, 'Desktop nav must sit left of the reference screen');
  assert.ok(layout.device.right < layout.context.left, 'Context panel must sit right of the reference screen');
  assert.equal(layout.overflow, false, 'Desktop should not overflow horizontally');
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });

  // Every desktop navigation item must open the matching reference screen and update context.
  for (const name of pageNames) {
    await page.locator('[data-nav="' + name + '"]').first().click();
    await page.waitForFunction(expected => document.querySelector('.screen.active')?.dataset.page === expected, name);
    assert.equal(await page.locator('#contextTitle').textContent(), ({
      home: 'Главная', map: 'Карта исследований', tarot: 'Таро', astrology: 'Астрология',
      psychology: 'Психология', dreams: 'Сновидения', arena: 'Арена Знаний', themes: 'Темы оформления'
    })[name], 'Context panel should follow page: ' + name);
  }

  // Reset route history so the Back button is tested from a known start.
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.screens.ready', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.screen.active')?.dataset.page === 'home', null, { timeout: 30000 });

  // Browser Back should restore the previous page after SPA navigation.
  await page.locator('[data-nav="tarot"]').first().click();
  await page.locator('[data-nav="astrology"]').first().click();
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('.screen.active')?.dataset.page === 'tarot');
  assert.equal(await page.locator('#devicePageName').textContent(), 'Таро');

  // Hotspot and modal interaction.
  await page.locator('.screen[data-page="tarot"] .hit[aria-label="Карта Звезда"]').click();
  assert.equal(await page.locator('#modal').isVisible(), true, 'Tarot card should open its detail modal');
  await page.locator('#modalOk').click();
  assert.equal(await page.locator('#modal').isVisible(), false, 'Modal should close');
  await page.locator('.screen[data-page="tarot"] .hit[aria-label="Назад"]').click();
  await page.waitForFunction(() => document.querySelector('.screen.active')?.dataset.page === 'home');

  // Tablet: compact icon rail, central artwork, no right panel.
  await page.setViewportSize({ width: 900, height: 1024 });
  layout = await page.evaluate(() => ({
    navDisplay: getComputedStyle(document.querySelector('.desktop-nav')).display,
    contextDisplay: getComputedStyle(document.querySelector('.context-panel')).display,
    navWidth: document.querySelector('.desktop-nav').getBoundingClientRect().width,
    deviceWidth: document.querySelector('.device').getBoundingClientRect().width,
    overflow: document.documentElement.scrollWidth > innerWidth
  }));
  assert.notEqual(layout.navDisplay, 'none', 'Tablet navigation should remain visible');
  assert.equal(layout.contextDisplay, 'none', 'Tablet should hide the desktop-only context panel');
  assert.ok(layout.navWidth < 100, 'Tablet navigation should collapse to a compact icon rail');
  assert.ok(layout.deviceWidth >= 320, 'Tablet screen should remain comfortably readable');
  assert.equal(layout.overflow, false, 'Tablet should not overflow horizontally');
  await page.screenshot({ path: 'test-results/tablet.png', fullPage: true });

  // Mobile: keep the original full-width portrait screen and hide desktop furniture.
  await page.setViewportSize({ width: 390, height: 844 });
  layout = await page.evaluate(() => ({
    navDisplay: getComputedStyle(document.querySelector('.desktop-nav')).display,
    contextDisplay: getComputedStyle(document.querySelector('.context-panel')).display,
    deviceWidth: document.querySelector('.device').getBoundingClientRect().width,
    overflow: document.documentElement.scrollWidth > innerWidth
  }));
  assert.equal(layout.navDisplay, 'none', 'Mobile should hide desktop navigation');
  assert.equal(layout.contextDisplay, 'none', 'Mobile should hide desktop context panel');
  assert.ok(Math.abs(layout.deviceWidth - 390) < 1.5, 'Mobile screen should use the full viewport width');
  assert.equal(layout.overflow, false, 'Mobile should not overflow horizontally');
  await page.locator('.screen[data-page="home"] .hit[aria-label="Таро"]').click();
  await page.waitForFunction(() => document.querySelector('.screen.active')?.dataset.page === 'tarot');
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });

  assert.deepEqual(failures, [], 'Browser console/runtime errors should be absent');
  console.log('PASS: 8 screens, hotspots, desktop/tablet/mobile layouts, navigation, browser history, modal and no console errors.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}