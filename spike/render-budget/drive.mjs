// THROWAWAY (ticket 04). Drives the harness across a config matrix under a
// phone viewport + CPU throttling, and writes the raw numbers to results/.
//
// Headful on purpose: headless Chrome falls back to SwiftShader for WebGL,
// which would understate the GPU by an order of magnitude. The driver records
// the unmasked renderer string on every run so that assumption is checkable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'file:///C:/Users/dusti/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'results');
const BASE = 'http://127.0.0.1:4399/';
const PROFILE = process.env.SPIKE_PROFILE || path.join(HERE, '.chrome-profile');

// Device presets. "phone" = the mobile parity gate; "desk" = the wide case.
const DEVICES = {
  phone: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  desk: { width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
};

const argv = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || '1'];
}));

const MATRIX = JSON.parse(fs.readFileSync(path.join(HERE, argv.matrix || 'matrix.json'), 'utf8'));
const only = argv.only ? new RegExp(argv.only) : null;

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false,
  userDataDir: PROFILE,
  args: ['--window-position=0,0', '--window-size=900,900', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: null,
});

const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console]', m.text()); });
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

const gpu = await (async () => {
  await page.goto('about:blank');
  return page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return { webgl2: false };
    const d = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      webgl2: true,
      vendor: d ? gl.getParameter(d.UNMASKED_VENDOR_WEBGL) : null,
      renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : null,
      maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    };
  });
})();
console.log('GPU:', JSON.stringify(gpu));
if (/swiftshader|llvmpipe|software/i.test(gpu.renderer || '')) {
  console.log('!! software rasteriser — WebGL numbers would be meaningless. Aborting.');
  await browser.close();
  process.exit(1);
}

const results = [];
for (const job of MATRIX) {
  const label = job.label || JSON.stringify(job.params);
  if (only && !only.test(label)) continue;

  const dev = DEVICES[job.device || 'phone'];
  await page.setViewport(dev);
  const client = await page.createCDPSession();
  await client.send('Emulation.setCPUThrottlingRate', { rate: job.cpu || 1 });

  const url = BASE + '?' + new URLSearchParams(job.params).toString();
  process.stdout.write(`${label}  cpu×${job.cpu || 1} ${job.device || 'phone'} ... `);
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction('window.__DONE === true', { timeout: 300000, polling: 250 });
  const r = await page.evaluate(() => ({ result: window.__RESULT, error: window.__ERROR }));
  if (r.error) console.log('ERROR', r.error);
  else console.log((r.result.runs || []).map((x) => `n=${x.n} draw=${x.drawMs.med}ms fps=${x.fps}`).join(' | ') || 'ok');

  if (job.shot) {
    await page.screenshot({ path: path.join(OUT, `${job.shot}.png`) });
  }
  results.push({ label, device: job.device || 'phone', cpu: job.cpu || 1, params: job.params, ...r });
  await client.detach();
}

fs.writeFileSync(path.join(OUT, argv.out || 'results.json'), JSON.stringify({ gpu, results }, null, 2));
console.log(`\nwrote ${path.join(OUT, argv.out || 'results.json')}`);
await browser.close();
