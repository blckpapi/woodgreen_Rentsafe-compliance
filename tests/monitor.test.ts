import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  band,
  numberOrNull,
  sourceDate,
  changesBetween,
  fetchSnapshot,
} from '../lib/city.ts';
import type { Snapshot } from '../lib/portfolio.ts';
const baseline = JSON.parse(
  await readFile(new URL('../lib/baseline.json', import.meta.url), 'utf8'),
) as Snapshot;
await test('Unavailable values never become a zero score or green band', () => {
  for (const value of [null, undefined, '', 'N/A'])
    assert.equal(numberOrNull(value), null);
  assert.equal(band(null), 'Unscored');
  assert.equal(numberOrNull('0'), 0);
  for (const [score, expected] of [
    [69, 'Red'],
    [70, 'Yellow'],
    [84, 'Yellow'],
    [85, 'Green'],
  ] as const)
    assert.equal(band(score), expected);
});
await test('Both City string dates and ArcGIS epoch dates retain their calendar date', () => {
  assert.equal(sourceDate('2026-09-07'), '2026-09-07');
  assert.equal(sourceDate(Date.UTC(2026, 8, 7)), '2026-09-07');
  assert.equal(sourceDate(null), null);
});
await test('Unchanged source generates no synthetic activity', () =>
  assert.deepEqual(changesBetween(baseline, structuredClone(baseline)), []));
await test('Score, band and reactive changes are distinct', () => {
  const next = structuredClone(baseline);
  next.buildings[0].score = 84;
  next.buildings[0].reactive = -2;
  const changes = changesBetween(baseline, next);
  assert.deepEqual(changes.map((c) => c.kind).sort(), [
    'band',
    'reactive',
    'score',
  ]);
});
await test('Order removals do not claim closure; missing coverage does not create removals', () => {
  const next = structuredClone(baseline);
  const building = next.buildings.find((b) => (b.orders?.length ?? 0) > 0)!;
  building.orders = [];
  const removed = changesBetween(baseline, next).filter(
    (c) => c.kind === 'order-removed',
  );
  assert.ok(removed.length > 0);
  assert.ok(
    removed.every((c) => c.message.includes('Closure is not confirmed')),
  );
  building.orders = null;
  assert.equal(
    changesBetween(baseline, next).filter((c) => c.kind === 'order-removed')
      .length,
    0,
  );
});
await test('Order additions and detail changes are retained separately', () => {
  const next = structuredClone(baseline);
  const building = next.buildings.find((b) => (b.orders?.length ?? 0) > 0)!;
  building.orders![0].deficiencies = 999;
  building.orders!.push({ ...building.orders![0], id: 'test-order' });
  assert.deepEqual(
    changesBetween(baseline, next)
      .map((c) => c.kind)
      .sort(),
    ['order-added', 'order-updated'],
  );
});
await test('Confidential programs never include an address key, registration or coordinate', () => {
  for (const b of baseline.buildings.filter((b) => !b.matchAddress)) {
    assert.equal(b.address, 'Address withheld');
    assert.equal(b.rsn, null);
    assert.equal(b.lat, null);
    assert.equal(b.lng, null);
    assert.equal(b.orders, null);
  }
});
await test('Source HTTP failure aborts a refresh', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  try {
    await assert.rejects(fetchSnapshot(), /HTTP 503/);
  } finally {
    globalThis.fetch = original;
  }
});
await test('Schema drift aborts before replacing data', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      success: true,
      result: { fields: [{ id: 'RENAMED_FIELD' }], records: [], total: 0 },
    });
  try {
    await assert.rejects(fetchSnapshot(), /field definitions changed/);
  } finally {
    globalThis.fetch = original;
  }
});
