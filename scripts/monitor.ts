import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fetchSnapshot, changesBetween } from '../lib/city.ts';
import type { Snapshot, Change } from '../lib/portfolio.ts';
type Feed = {
  snapshot: Snapshot;
  changes: Change[];
  lastAttempt: string;
  warning: string | null;
};
const target = new URL('../data/monitor.json', import.meta.url);
let previous: Feed;
try {
  previous = JSON.parse(await readFile(target, 'utf8'));
} catch {
  previous = {
    snapshot: JSON.parse(
      await readFile(new URL('../lib/baseline.json', import.meta.url), 'utf8'),
    ),
    changes: [],
    lastAttempt: '',
    warning: null,
  };
}
const lastAttempt = new Date().toISOString();
try {
  const snapshot = await fetchSnapshot();
  const oldCount = previous.snapshot.buildings.reduce(
      (n, b) => n + (b.orders?.length ?? 0),
      0,
    ),
    newCount = snapshot.buildings.reduce(
      (n, b) => n + (b.orders?.length ?? 0),
      0,
    );
  if (oldCount >= 4 && newCount < oldCount * 0.5)
    throw new Error(
      'Listed items fell by more than half. Verify the City source before accepting this change.',
    );
  const oldMatched = previous.snapshot.buildings.filter((b) => b.rsn).length;
  if (snapshot.buildings.filter((b) => b.rsn).length < oldMatched * 0.7)
    throw new Error('Matched registrations fell unexpectedly.');
  const changes = changesBetween(previous.snapshot, snapshot).map((c) => ({
    ...c,
    id: [c.observedAt, c.buildingId, c.kind, c.message].join('|'),
    reviewed: 0,
  }));
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await writeFile(
    target,
    JSON.stringify(
      {
        snapshot,
        changes: [...previous.changes, ...changes].slice(-2000),
        lastAttempt,
        warning: null,
      } satisfies Feed,
      null,
      2,
    ),
  );
  console.log(
    `Verified ${snapshot.buildings.filter((b) => b.rsn).length} buildings; ${changes.length} changes. ${snapshot.checkedAt}`,
  );
} catch (error) {
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await writeFile(
    target,
    JSON.stringify(
      {
        ...previous,
        lastAttempt,
        warning:
          error instanceof Error ? error.message : 'Source check failed.',
      },
      null,
      2,
    ),
  );
  console.error('Monitoring failed. Previous snapshot retained.');
  process.exitCode = 1;
}
