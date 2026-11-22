import { test, assert } from './harness.js';
import { chooseFormat, browserFamily } from '../ui/device.js';

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
