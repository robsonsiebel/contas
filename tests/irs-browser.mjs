import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fixture } from './fixtures.mjs';

// Playwright is development-only; the deployed application still has no dependencies.
const { chromium } = createRequire(import.meta.url)(process.env.CONTAS_PLAYWRIGHT_MODULE || '@playwright/test');
const html = await readFile(new URL('../index.html', import.meta.url));
const server = createServer((request, response) => {
  if (!['/', '/index.html'].includes(request.url)) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-proxy-server'] });
const euro = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
const euro0 = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const readCache = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('contas.data.v1')));
const viewMonth = (page) => page.evaluate(() => { year = 2026; tab = '11'; render(); });
const valueFor = (page, label) => page.locator('.kpi').filter({ has: page.getByText(label, { exact: true }) }).locator('.value').textContent();
async function seed(context, data, connected = false) {
  await context.addInitScript(({ data, connected }) => {
    if (!localStorage.getItem('contas.data.v1')) localStorage.setItem('contas.data.v1', JSON.stringify(data));
    if (connected) localStorage.setItem('contas.cfg.v1', JSON.stringify({ owner: 'fixture-owner', repo: 'fixture-data', path: 'data.json', branch: 'main', token: 'synthetic-test-token' }));
  }, { data, connected });
}
async function editIRS(page, text) {
  const input = page.getByRole('textbox', { name: 'Reembolso do IRS', exact: true });
  await input.fill(text); await input.press('Tab');
}

try {
  for (const [name, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport });
    await context.route('**/*', (route) => route.request().url().startsWith(url) ? route.continue() : route.abort());
    await seed(context, fixture);
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url); await viewMonth(page);
    assert.equal(await page.getByRole('textbox', { name: 'Reembolso do IRS', exact: true }).inputValue(), '');
    assert.deepEqual(await readCache(page), fixture, 'Opening legacy data must not save or add fields');
    assert.equal(await valueFor(page, 'Sobra'), euro.format(1800));
    await editIRS(page, '1.250,50');
    const expected = structuredClone(fixture); expected.months['2026-11'].irsRefund = 1250.5;
    assert.deepEqual(await readCache(page), expected, 'Only the selected month IRS field may change');
    assert.equal(await valueFor(page, 'Sobra'), euro.format(3050.5));
    assert.equal(await page.getByRole('textbox', { name: 'Salário', exact: true }).inputValue(), '2000');
    assert.equal(await page.getByRole('textbox', { name: 'Bónus / outros', exact: true }).inputValue(), '100');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await mkdir(new URL('../docs/qa/', import.meta.url), { recursive: true });
    await page.screenshot({ path: new URL(`../docs/qa/irs-${name}.png`, import.meta.url).pathname, fullPage: true });
    await page.getByRole('button', { name: 'Resumo 2026', exact: true }).click();
    assert.equal(await valueFor(page, 'Rendimento'), euro0.format(5290.5));
    assert.equal(await valueFor(page, 'Reembolso do IRS'), euro0.format(1250.5));
    assert.equal(await page.locator('tbody tr').filter({ has: page.getByText('Reembolso do IRS', { exact: true }) }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#btnSettings').click();
    const downloadReady = page.waitForEvent('download');
    await page.locator('#btnExport').click();
    const stream = await (await downloadReady).createReadStream(); let exported = '';
    for await (const chunk of stream) exported += chunk;
    assert.deepEqual(JSON.parse(exported), expected, 'JSON export must preserve IRS and all previous records');
    await page.reload(); await viewMonth(page);
    assert.equal(await page.getByRole('textbox', { name: 'Reembolso do IRS', exact: true }).inputValue(), '1250,5');
    assert.deepEqual(await readCache(page), expected);
    await editIRS(page, ''); expected.months['2026-11'].irsRefund = 0;
    assert.deepEqual(await readCache(page), expected);
    assert.equal(await valueFor(page, 'Sobra'), euro.format(1800));
    assert.deepEqual(errors, []);
    await context.close(); console.log(`PASS ${name}: legacy preservation, edit, annual totals, export, reload, clearing and responsive layout`);
  }

  for (const conflict of [false, true]) {
    const context = await browser.newContext();
    const stale = structuredClone(fixture); stale.months['2026-11'].expenses = [];
    await seed(context, stale, true);
    let puts = 0; let sent; const methods = [];
    const cors = { 'access-control-allow-origin': new URL(url).origin, 'access-control-allow-methods': 'GET, PUT, OPTIONS', 'access-control-allow-headers': 'authorization, accept, x-github-api-version, content-type' };
    await context.route('**/*', async (route) => {
      const request = route.request();
      if (request.url().startsWith(url)) { await route.continue(); return; }
      methods.push(request.method());
      if (!request.url().startsWith('https://api.github.com/repos/fixture-owner/fixture-data/contents/data.json')) { await route.abort(); return; }
      if (request.method() === 'OPTIONS') await route.fulfill({ status: 204, headers: cors });
      else if (request.method() === 'GET') await route.fulfill({ headers: cors, json: { sha: 'current-fixture-sha', content: Buffer.from(JSON.stringify(fixture)).toString('base64') } });
      else if (request.method() === 'PUT') {
        puts++; const body = request.postDataJSON(); sent = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
        assert.equal(body.sha, 'current-fixture-sha'); assert.equal(body.branch, 'main');
        await route.fulfill(conflict ? { status: 409, headers: cors, json: { message: 'Conflict' } } : { headers: cors, json: { content: { sha: 'saved-fixture-sha' } } });
      } else await route.abort();
    });
    const page = await context.newPage(); await page.goto(url);
    try {
      await page.waitForFunction(() => document.querySelector('#syncText').textContent === 'Sincronizado', null, { timeout: 5000 });
    } catch {
      const status = await page.locator('#syncText').textContent();
      const detail = await page.locator('#banner').textContent();
      throw new Error(`Mock connection failed: ${JSON.stringify({ status, detail, methods })}`);
    }
    await viewMonth(page); assert.deepEqual(await readCache(page), fixture, 'Fresh remote records must replace stale cache');
    assert.equal(puts, 0);
    await editIRS(page, '900,25');
    if (conflict) await page.waitForFunction(() => document.querySelector('#banner').textContent.includes('alterado noutro dispositivo'));
    else await page.waitForFunction(() => document.querySelector('#syncText').textContent === 'Guardado no GitHub');
    const expected = structuredClone(fixture); expected.months['2026-11'].irsRefund = 900.25;
    assert.deepEqual(sent, expected, 'Mocked GitHub save must preserve every fresh record and unknown field');
    assert.deepEqual(await readCache(page), expected);
    await page.waitForTimeout(1500); assert.equal(puts, 1, 'No forced or automatic overwrite after a conflict');
    await context.close(); console.log(`PASS mocked GitHub ${conflict ? 'conflict' : 'save'}: latest data preserved; no real API writes`);
  }
} finally {
  await browser.close(); await new Promise((resolve) => server.close(resolve));
}
