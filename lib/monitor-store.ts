import { env } from 'cloudflare:workers';
import baseline from './baseline.json';
import { changesBetween, fetchSnapshot } from './city';
import type { Snapshot, Change } from './portfolio';
type StateRow = {
  payload: string;
  checked_at: string;
  last_attempt: string | null;
  warning: string | null;
  feed_read_at: number;
};
type Feed = {
  snapshot: Snapshot;
  changes: Change[];
  lastAttempt: string;
  warning: string | null;
};
const feedUrl =
  'https://raw.githubusercontent.com/blckpapi/woodgreen_Rentsafe-compliance/main/data/monitor.json';
function db() {
  const binding = (env as unknown as { DB: D1Database }).DB;
  if (!binding) throw new Error('Monitoring storage is unavailable.');
  return binding;
}
async function state() {
  const database = db();
  await database
    .prepare(
      'INSERT OR IGNORE INTO monitor_state (id,payload,checked_at) VALUES (?,?,?)',
    )
    .bind('portfolio', JSON.stringify(baseline), baseline.checkedAt)
    .run();
  return (await database
    .prepare('SELECT * FROM monitor_state WHERE id = ?')
    .bind('portfolio')
    .first<StateRow>())!;
}
function validateSnapshot(snapshot: Snapshot, previous: Snapshot) {
  if (
    !snapshot ||
    !Array.isArray(snapshot.buildings) ||
    snapshot.buildings.length !== baseline.buildings.length ||
    !Number.isFinite(Date.parse(snapshot.checkedAt)) ||
    Date.parse(snapshot.checkedAt) > Date.now() + 300000
  )
    throw new Error('Incoming snapshot failed validation.');
  const oldMatched = previous.buildings.filter((b) => b.rsn).length,
    newMatched = snapshot.buildings.filter((b) => b.rsn).length;
  if (newMatched < oldMatched * 0.7)
    throw new Error('Registration coverage fell unexpectedly.');
  const previousOrders = previous.buildings.reduce(
      (n, b) => n + (b.orders?.length ?? 0),
      0,
    ),
    newOrders = snapshot.buildings.reduce(
      (n, b) => n + (b.orders?.length ?? 0),
      0,
    );
  if (previousOrders >= 4 && newOrders < previousOrders * 0.5)
    throw new Error(
      'Listed items fell by more than half. Manual source verification is needed before replacing the snapshot.',
    );
}
async function saveSnapshot(snapshot: Snapshot, extra: Change[] = []) {
  const previous = JSON.parse((await state()).payload) as Snapshot;
  validateSnapshot(snapshot, previous);
  const newer = snapshot.checkedAt > previous.checkedAt;
  const changes: Change[] = newer
    ? changesBetween(previous, snapshot).map((c) => ({
        ...c,
        id: [c.observedAt, c.buildingId, c.kind, c.message].join('|'),
        reviewed: 0,
      }))
    : [];
  const all = new Map([...extra, ...changes].map((c) => [c.id, c]));
  const statements = [...all.values()]
    .filter(
      (c) =>
        baseline.buildings.some((b) => b.id === c.buildingId) &&
        c.message.length < 1000,
    )
    .slice(-2000)
    .map((c) =>
      db()
        .prepare(
          'INSERT OR IGNORE INTO monitor_events (id,building_id,kind,message,observed_at,reviewed) VALUES (?,?,?,?,?,0)',
        )
        .bind(c.id, c.buildingId, c.kind, c.message, c.observedAt),
    );
  if (newer)
    statements.push(
      db()
        .prepare(
          'UPDATE monitor_state SET payload = ?, checked_at = ? WHERE id = ? AND checked_at < ?',
        )
        .bind(
          JSON.stringify(snapshot),
          snapshot.checkedAt,
          'portfolio',
          snapshot.checkedAt,
        ),
    );
  for (let i = 0; i < statements.length; i += 80)
    await db().batch(statements.slice(i, i + 80));
}
async function acquire() {
  await state();
  return (
    (
      await db()
        .prepare(
          'UPDATE monitor_state SET lease_until = ? WHERE id = ? AND lease_until < ?',
        )
        .bind(Date.now() + 180000, 'portfolio', Date.now())
        .run()
    ).meta.changes === 1
  );
}
async function release() {
  await db()
    .prepare('UPDATE monitor_state SET lease_until = 0 WHERE id = ?')
    .bind('portfolio')
    .run();
}
export async function readMonitor(refresh = false) {
  const existing = await state();
  const shouldCheck = refresh || Date.now() - existing.feed_read_at > 300000;
  const acquired = shouldCheck ? await acquire() : false;
  if (acquired) {
    try {
      if (refresh) {
        const snapshot = await fetchSnapshot();
        await saveSnapshot(snapshot);
        await db()
          .prepare(
            'UPDATE monitor_state SET last_attempt = ?,warning = NULL WHERE id = ?',
          )
          .bind(snapshot.checkedAt, 'portfolio')
          .run();
      } else {
        const response = await fetch(feedUrl, {
          signal: AbortSignal.timeout(15000),
          headers: { Accept: 'application/json' },
        });
        if (!response.ok)
          throw new Error('Scheduled feed could not be reached.');
        const body = await response.text();
        if (body.length > 6000000)
          throw new Error('Scheduled feed exceeded its size limit.');
        const feed = JSON.parse(body) as Feed;
        if (!Array.isArray(feed.changes))
          throw new Error('Scheduled feed history is invalid.');
        await saveSnapshot(feed.snapshot, feed.changes);
        await db()
          .prepare(
            'UPDATE monitor_state SET last_attempt = ?,warning = ?,feed_read_at = ? WHERE id = ?',
          )
          .bind(feed.lastAttempt, feed.warning, Date.now(), 'portfolio')
          .run();
      }
    } catch (error) {
      await db()
        .prepare(
          'UPDATE monitor_state SET last_attempt = ?,warning = ?,feed_read_at = ? WHERE id = ?',
        )
        .bind(
          new Date().toISOString(),
          error instanceof Error &&
            /^(City|Registration|Portfolio|Order|Evaluation|Listed|Matched|Scheduled|Incoming)/.test(
              error.message,
            )
            ? error.message
            : 'A source request could not be completed.',
          Date.now(),
          'portfolio',
        )
        .run();
    } finally {
      await release();
    }
  }
  const current = await state();
  const changes = await db()
    .prepare(
      'SELECT id,building_id AS buildingId,kind,message,observed_at AS observedAt,reviewed FROM monitor_events ORDER BY observed_at DESC LIMIT 1000',
    )
    .all<Change>();
  return {
    snapshot: JSON.parse(current.payload) as Snapshot,
    changes: changes.results,
    lastAttempt: current.last_attempt,
    warning:
      refresh && !acquired
        ? 'A source check is already running. Please check again shortly.'
        : current.warning,
  };
}
export async function setReviewed(id: string, reviewed: boolean) {
  return (
    (
      await db()
        .prepare('UPDATE monitor_events SET reviewed = ? WHERE id = ?')
        .bind(reviewed ? 1 : 0, id)
        .run()
    ).meta.changes === 1
  );
}
