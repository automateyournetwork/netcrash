import { test, assert } from './harness.js';
import { chooseFormat, browserFamily, sceneSize, createQualityMonitor } from '../ui/device.js';

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  pixel: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  androidTablet: 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  edgeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
};

test('phones choose the mobile (vertical) format; desktops choose the desktop format', () => {
  assert.equal(chooseFormat({ userAgent: UA.iphone }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: UA.pixel }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: UA.chromeWin }).format, 'desktop');
  assert.equal(chooseFormat({ userAgent: UA.edgeWin }).format, 'desktop');
  assert.equal(chooseFormat({ userAgent: UA.firefox }).format, 'desktop');
  assert.equal(chooseFormat({ userAgent: UA.safariMac }).format, 'desktop');
});
test('client hints (userAgentData.mobile) decide even when the user agent is generic', () => {
  assert.equal(chooseFormat({ userAgent: UA.chromeWin, uaMobile: true }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: UA.pixel, uaMobile: false }).format, 'mobile', 'the UA still says phone');
});
test('tablets: upright = mobile, sideways = desktop; iPadOS (a Mac user agent with touch) is recognised', () => {
  assert.equal(chooseFormat({ userAgent: UA.androidTablet, width: 800, height: 1280 }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: UA.androidTablet, width: 1280, height: 800 }).format, 'desktop');
  assert.equal(chooseFormat({ userAgent: UA.ipad, coarse: true, width: 820, height: 1180 }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: UA.ipad, coarse: true, width: 1180, height: 820 }).format, 'desktop');
  assert.equal(chooseFormat({ userAgent: UA.safariMac, coarse: false, width: 1180, height: 820 }).format, 'desktop', 'a real Mac stays desktop');
});
test('a small touch screen with an unknown user agent is mobile', () => {
  assert.equal(chooseFormat({ userAgent: 'x', coarse: true, width: 390, height: 800 }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: 'x', coarse: true, width: 1400, height: 900 }).format, 'desktop');
});
test('the format override wins, in either direction, and junk values mean auto', () => {
  assert.equal(chooseFormat({ userAgent: UA.chromeWin, override: 'mobile' }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: UA.iphone, override: 'desktop' }).format, 'desktop');
  assert.equal(chooseFormat({ userAgent: UA.iphone, override: 'banana' }).format, 'mobile');
  assert.equal(chooseFormat({ userAgent: UA.chromeWin, override: 'MOBILE' }).reason, 'override');
});
test('browser family detection', () => {
  assert.equal(browserFamily(UA.edgeWin), 'edge'); assert.equal(browserFamily(UA.chromeWin), 'chrome'); assert.equal(browserFamily(UA.firefox), 'firefox');
  assert.equal(browserFamily(UA.safariMac), 'safari'); assert.equal(browserFamily(UA.iphone), 'safari'); assert.equal(browserFamily(UA.pixel), 'chrome'); assert.equal(browserFamily(''), 'other');
});

test('scene size: landscape keeps height 400 and widens within 430..1000; portrait keeps width 420 and grows within 420..900; ground stays at y=400', () => {
  let z = sceneSize(1280, 646); assert.equal(z.h, 400); assert.equal(z.w, 793); assert.equal(z.vy, 0); assert.equal(z.portrait, false);
  z = sceneSize(3440, 1000); assert.equal(z.w, 1000);
  z = sceneSize(900, 900); assert.equal(z.w, 430);
  z = sceneSize(390, 760); assert.equal(z.portrait, true); assert.equal(z.w, 420); assert.equal(z.h, 818); assert.equal(z.vy, 400 - 818);
  z = sceneSize(300, 2000); assert.equal(z.h, 900);
  z = sceneSize(0, 0); assert.equal(z.w, 700);
});
test('quality monitor: a steady 60 fps never goes low; 20 fps for over 3 s of flight goes low; not while not flying', () => {
  const good = createQualityMonitor(); let r;
  for (let i = 0; i < 400; i++) r = good.note(i * 16.7, 16.7, true);
  assert.ok(r.fps >= 58 && r.fps <= 61, `fps ${r.fps}`); assert.equal(r.low, false);
  const slow = createQualityMonitor(); let lowAt = null;
  for (let i = 0; i < 200; i++) { r = slow.note(i * 50, 50, true); if (r.low && lowAt === null) lowAt = i * 50; }
  assert.ok(r.fps <= 21); assert.ok(lowAt !== null && lowAt >= 3000 && lowAt < 5500, `low at ${lowAt}`);
  const idle = createQualityMonitor();
  for (let i = 0; i < 200; i++) r = idle.note(i * 50, 50, false);
  assert.equal(r.low, false, 'menus and questions never trigger the downgrade');
  const recovers = createQualityMonitor();
  for (let i = 0; i < 40; i++) recovers.note(i * 50, 50, true);
  for (let i = 0; i < 400; i++) r = recovers.note(2000 + i * 16.7, 16.7, true);
  assert.equal(r.low, false, 'a short dip recovers');
});
