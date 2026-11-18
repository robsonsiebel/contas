import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { fixture } from './fixtures.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Parse the entire application, not only the tested functions.

function app(source = html) {
  const context = vm.createContext({ localStorage: { getItem: () => null }, document: { querySelector: () => null } });
  const code = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const state = code.slice(0, code.indexOf('/* ---------- GitHub sync'));
  const money = code.slice(code.indexOf('function money(v)'), code.indexOf('function sheetUrls'));
  vm.runInContext(state + '\n' + money, context);
  return {
    run: (expression) => vm.runInContext(expression, context),
    seed: (value) => { context.seed = structuredClone(value); vm.runInContext('data=normalize(seed)', context); },
    json: (expression) => JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context)),
  };
}

test('legacy months preserve all records and original totals without adding IRS fields', () => {
  const a = app(); a.seed(fixture);
  const before = a.json('data');
  const totals = a.json('totals(2026,11)');
  assert.equal(totals.income, 2100);
  assert.equal(totals.left, 1800);
  assert.equal(totals.irsRefund, 0);
  assert.deepEqual(a.json('data'), before);
  assert.deepEqual(a.json('data'), fixture);
  assert.equal(a.run("Object.hasOwn(data.months['2026-11'],'irsRefund')"), false);
});

test('IRS is income, counted once, without modifying expenses or investments', () => {
  const a = app(); a.seed(fixture);
  a.run('month(2026,11,true).irsRefund=1250.50');
  const t = a.json('totals(2026,11)');
  assert.equal(t.income, 3350.5);
  assert.equal(t.left, 3050.5);
  assert.equal(t.spent, 200);
  assert.equal(t.inv, 100);
  const expected = structuredClone(fixture); expected.months['2026-11'].irsRefund = 1250.5;
  assert.deepEqual(a.json('data'), expected);
  assert.equal(a.json('totals(2026,10)').income, 1940);
  assert.equal(a.json('totals(2025,11)').income, 730);
});

test('an IRS-only month is active and clearing the amount restores zero income', () => {
  const a = app(); a.seed(fixture);
  a.run('month(2026,12,true).irsRefund=500');
  assert.equal(a.json('totals(2026,12)').income, 500);
  assert.equal(a.json('totals(2026,12)').hasData, true);
  a.run('month(2026,12,true).irsRefund=0');
  assert.equal(a.json('totals(2026,12)').income, 0);
  assert.equal(a.json('totals(2026,12)').hasData, false);
});

test('IRS survives JSON round trips with version 1 and unknown fields intact', () => {
  const a = app(); a.seed(fixture);
  a.run('month(2026,11,true).irsRefund=725.35');
  const saved = a.json('data');
  a.seed(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(a.json('data'), saved);
  assert.equal(a.json('data').version, 1);
  assert.equal(a.json('totals(2026,11)').irsRefund, 725.35);
});

test('IRS uses the established money parser for Portuguese separators and clearing', () => {
  const a = app();
  for (const text of ['1.250,50', '1 250,50', '1250,50', '1250.50', '1,250.50', '€ 1.250,50']) {
    assert.equal(a.run(`money(${JSON.stringify(text)})`), 1250.5);
  }
  assert.equal(a.run('money("")'), 0);
});

test('annual income includes each monthly refund once', () => {
  const a = app(); a.seed(fixture);
  a.run('month(2026,6,true).irsRefund=800;month(2026,11,true).irsRefund=1250.5');
  assert.equal(a.run('Array.from({length:12},(_,i)=>totals(2026,i+1).income).reduce((a,b)=>a+b,0)'), 6090.5);
  assert.equal(a.run('Array.from({length:12},(_,i)=>totals(2026,i+1).irsRefund).reduce((a,b)=>a+b,0)'), 2050.5);
});

test('meal allowance preserves existing IRS, records and unknown fields', () => {
  const a = app(); const existing = structuredClone(fixture);
  existing.months['2026-11'].irsRefund = 500;
  a.seed(existing);
  assert.equal(a.json('totals(2026,11)').mealAllowance, 0);
  assert.deepEqual(a.json('data'), existing);
  a.run('month(2026,11,true).mealAllowance=220.50');
  const t = a.json('totals(2026,11)');
  assert.equal(t.income, 2820.5); assert.equal(t.left, 2520.5);
  assert.equal(t.irsRefund, 500); assert.equal(t.spent, 200); assert.equal(t.inv, 100);
  const expected = structuredClone(existing); expected.months['2026-11'].mealAllowance = 220.5;
  assert.deepEqual(a.json('data'), expected);
  a.seed(a.json('data')); assert.deepEqual(a.json('data'), expected);
});

test('meal-only month, annual totals and clearing remain consistent', () => {
  const a = app(); a.seed(fixture);
  a.run('month(2026,6,true).mealAllowance=220;month(2026,12,true).mealAllowance=220.5');
  assert.equal(a.json('totals(2026,12)').hasData, true);
  assert.equal(a.run('Array.from({length:12},(_,i)=>totals(2026,i+1).income).reduce((a,b)=>a+b,0)'), 4480.5);
  assert.equal(a.run('Array.from({length:12},(_,i)=>totals(2026,i+1).mealAllowance).reduce((a,b)=>a+b,0)'), 440.5);
  a.run('month(2026,12,true).mealAllowance=0');
  assert.equal(a.json('totals(2026,12)').hasData, false);
  assert.equal(a.json('totals(2026,12)').income, 0);
});

test('current private snapshot normalizes exactly as the deployed app, without exposing values', {
  skip: !(process.env.CONTAS_DATA_SNAPSHOT && process.env.CONTAS_BASELINE_HTML),
}, () => {
  const saved = JSON.parse(readFileSync(process.env.CONTAS_DATA_SNAPSHOT, 'utf8'));
  const old = app(readFileSync(process.env.CONTAS_BASELINE_HTML, 'utf8'));
  const updated = app(); old.seed(saved); updated.seed(saved);
  const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  assert.equal(digest(old.json('data')), digest(updated.json('data')), 'Existing saved data must normalize identically');
});
