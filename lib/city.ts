import {
  CKAN,
  REG_RESOURCE,
  EVAL_RESOURCE,
  ORDER_LAYER,
  portfolio,
} from './portfolio.ts';
import type { Building, Snapshot, Change } from './portfolio.ts';
type Row = Record<string, unknown>;
type CityResponse = {
  error?: unknown;
  success?: boolean;
  result: { fields: { id: string }[]; records: Row[]; total: number };
  fields?: { name: string }[];
  count?: number;
  editingInfo?: { lastEditDate: number };
  features?: { attributes: Row }[];
  exceededTransferLimit?: boolean;
};
export function numberOrNull(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (value === null || value === undefined || String(value).trim() === '')
    return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
export function band(score: number | null) {
  return score === null
    ? 'Unscored'
    : score >= 85
      ? 'Green'
      : score >= 70
        ? 'Yellow'
        : 'Red';
}
export function sourceDate(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))
    return value.slice(0, 10);
  const date = new Date(typeof value === 'number' ? value : String(value));
  if (!Number.isFinite(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}
const norm = (value: unknown) =>
  (typeof value === 'string' || typeof value === 'number' ? String(value) : '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
async function json(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok)
    throw new Error(`City source returned HTTP ${response.status}.`);
  const result = (await response.json()) as CityResponse;
  if (result.error || result.success === false)
    throw new Error('City source returned an error.');
  return result;
}
async function ckan(
  resource: string,
  fields: string[],
  filters?: Record<string, unknown>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const params = new URLSearchParams({
      resource_id: resource,
      limit: '1000',
      offset: String(offset),
    });
    if (fields.length) params.set('fields', fields.join(','));
    if (filters) params.set('filters', JSON.stringify(filters));
    const data = await json(CKAN + '/datastore_search?' + params);
    const liveFields =
      data.result?.fields?.map((f: { id: string }) => f.id) ?? [];
    if (fields.some((f) => !liveFields.includes(f)))
      throw new Error(
        'City field definitions changed. Previous data retained.',
      );
    const records = data.result?.records;
    if (!Array.isArray(records))
      throw new Error('City source returned no record collection.');
    rows.push(...records);
    if (rows.length >= data.result.total || records.length < 1000) return rows;
  }
  throw new Error('City result exceeded the bounded fetch limit.');
}
export async function fetchSnapshot(): Promise<Snapshot> {
  const registrations = await ckan(REG_RESOURCE, [
    'RSN',
    'SITE_ADDRESS',
    'CONFIRMED_UNITS',
    'CONFIRMED_STOREYS',
    'PROP_MANAGEMENT_COMPANY_NAME',
    'WARD',
  ]);
  if (registrations.length < 1000)
    throw new Error(
      'Registration feed is unexpectedly incomplete. Previous data retained.',
    );
  const matched = portfolio.map((location) => {
    const matches = location.matchAddress
      ? registrations.filter(
          (r) => norm(r.SITE_ADDRESS) === norm(location.matchAddress),
        )
      : [];
    return { location, reg: matches.length === 1 ? matches[0] : undefined };
  });
  const ids = matched.flatMap((m) => (m.reg ? [String(m.reg.RSN)] : []));
  if (ids.length < 8 || ids.some((id) => !/^\d+$/.test(id)))
    throw new Error('Portfolio matching could not be verified.');
  const [evaluations, layer, total] = await Promise.all([
    ckan(EVAL_RESOURCE, [], { RSN: ids }),
    json(ORDER_LAYER + '?f=json'),
    json(ORDER_LAYER + '/query?where=1%3D1&returnCountOnly=true&f=json'),
  ]);
  const requiredFields = [
    'FOLDERRSN_RAI',
    'FOLDERNUMBER_IV',
    'VIOLATION_TYPE',
    'BYLAW_DETAIL',
    'OPEN_DATE',
    'DEFICIENCY_COUNT',
  ];
  if (
    requiredFields.some(
      (f) => !layer.fields?.some((x: { name: string }) => x.name === f),
    ) ||
    !((total.count ?? 0) > 0)
  )
    throw new Error(
      'Order feed could not be validated. Previous data retained.',
    );
  const edited = layer.editingInfo?.lastEditDate;
  if (edited && Date.now() - edited > 45 * 86400000)
    throw new Error(
      'City order feed is more than 45 days old. Previous data retained.',
    );
  const ordersData = await json(
    ORDER_LAYER +
      '/query?' +
      new URLSearchParams({
        where: `FOLDERRSN_RAI IN (${ids.join(',')})`,
        outFields: requiredFields.join(','),
        returnGeometry: 'false',
        resultRecordCount: '2000',
        f: 'json',
      }),
  );
  if (!Array.isArray(ordersData.features) || ordersData.exceededTransferLimit)
    throw new Error('Order results are incomplete. Previous data retained.');
  const orders: Row[] = ordersData.features.map(
    (f: { attributes: Row }) => f.attributes,
  );
  const buildings: Building[] = matched.map(({ location, reg }) => {
    const rsn = reg ? String(reg.RSN) : null;
    const history = evaluations
      .filter((e) => String(e.RSN) === rsn)
      .sort((a, b) =>
        String(b['EVALUATION COMPLETED ON']).localeCompare(
          String(a['EVALUATION COMPLETED ON']),
        ),
      );
    const ev = history[0];
    if (
      ev &&
      ![
        'CURRENT BUILDING EVAL SCORE',
        'CURRENT REACTIVE SCORE',
        'EVALUATION COMPLETED ON',
      ].every((f) => f in ev)
    )
      throw new Error('Evaluation field definitions changed.');
    const categories = ev
      ? Object.entries(ev)
          .filter(
            ([key, value]) =>
              key !== '_id' &&
              ![
                'WARD',
                'RSN',
                'YEAR REGISTERED',
                'YEAR BUILT',
                'YEAR EVALUATED',
                'CONFIRMED STOREYS',
                'CONFIRMED UNITS',
                'NO OF AREAS EVALUATED',
                'CURRENT REACTIVE SCORE',
                'CURRENT BUILDING EVAL SCORE',
                'PROACTIVE BUILDING SCORE',
                'LATITUDE',
                'LONGITUDE',
                'X',
                'Y',
              ].includes(key) &&
              ['1', '2', '3'].includes(String(value)),
          )
          .map(([name, rating]) => ({ name, rating: Number(rating) }))
      : [];
    const mappedOrders = rsn
      ? orders
          .filter((o) => String(o.FOLDERRSN_RAI) === rsn)
          .map((o) => ({
            id: String(o.FOLDERNUMBER_IV),
            type: String(o.VIOLATION_TYPE),
            bylaw: String(o.BYLAW_DETAIL),
            opened: sourceDate(o.OPEN_DATE),
            deficiencies: numberOrNull(o.DEFICIENCY_COUNT),
            primary:
              norm(o.BYLAW_DETAIL) === 'PROPERTY STANDARDS' &&
              norm(o.VIOLATION_TYPE).includes('ORDER'),
          }))
          .sort((a, b) => a.id.localeCompare(b.id))
      : null;
    return {
      ...location,
      rsn,
      cityAddress: reg ? String(reg.SITE_ADDRESS) : null,
      units: numberOrNull(reg?.CONFIRMED_UNITS),
      storeys: numberOrNull(reg?.CONFIRMED_STOREYS),
      management: reg ? String(reg.PROP_MANAGEMENT_COMPANY_NAME) : null,
      ward: ev ? String(ev.WARDNAME) : reg ? String(reg.WARD) : null,
      score: numberOrNull(ev?.['CURRENT BUILDING EVAL SCORE']),
      proactive: numberOrNull(ev?.['PROACTIVE BUILDING SCORE']),
      reactive: numberOrNull(ev?.['CURRENT REACTIVE SCORE']),
      evaluated: ev ? String(ev['EVALUATION COMPLETED ON']) : null,
      lat: numberOrNull(ev?.LATITUDE),
      lng: numberOrNull(ev?.LONGITUDE),
      history: history.map((h) => ({
        date: String(h['EVALUATION COMPLETED ON']),
        score: numberOrNull(h['CURRENT BUILDING EVAL SCORE']),
      })),
      categories,
      orders: mappedOrders,
    };
  });
  if (buildings.filter((b) => b.score !== null).length < 8)
    throw new Error(
      'Evaluation coverage is unexpectedly low. Previous data retained.',
    );
  return {
    checkedAt: new Date().toISOString(),
    sourceUpdatedAt: edited ? new Date(edited).toISOString() : null,
    buildings,
    sourceStatus: 'verified',
  };
}
export function changesBetween(
  previous: Snapshot,
  next: Snapshot,
): Omit<Change, 'id' | 'reviewed'>[] {
  const changes: Omit<Change, 'id' | 'reviewed'>[] = [];
  for (const current of next.buildings) {
    const before = previous.buildings.find((b) => b.id === current.id);
    if (!before) continue;
    const add = (kind: string, message: string) =>
      changes.push({
        buildingId: current.id,
        kind,
        message,
        observedAt: next.checkedAt,
      });
    if (before.score !== current.score)
      add(
        'score',
        `Score changed from ${before.score ?? 'unavailable'} to ${current.score ?? 'unavailable'}.`,
      );
    if (band(before.score) !== band(current.score))
      add(
        'band',
        `Score band changed from ${band(before.score)} to ${band(current.score)}.`,
      );
    if (before.reactive !== current.reactive)
      add(
        'reactive',
        `Reactive score changed from ${before.reactive ?? 'unavailable'} to ${current.reactive ?? 'unavailable'}.`,
      );
    if (before.orders && current.orders) {
      for (const order of current.orders) {
        const old = before.orders.find((o) => o.id === order.id);
        if (!old)
          add(
            'order-added',
            `${order.id}: newly listed ${order.bylaw} ${order.type}.`,
          );
        else if (JSON.stringify(old) !== JSON.stringify(order))
          add('order-updated', `${order.id}: listed order details changed.`);
      }
      for (const order of before.orders)
        if (!current.orders.some((o) => o.id === order.id))
          add(
            'order-removed',
            `${order.id}: no longer listed in the City layer. Closure is not confirmed.`,
          );
    }
  }
  return changes;
}
