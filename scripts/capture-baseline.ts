import { writeFile } from 'node:fs/promises';
import { fetchSnapshot } from '../lib/city.ts';
const snapshot = await fetchSnapshot();
await writeFile(
  new URL('../lib/baseline.json', import.meta.url),
  JSON.stringify(snapshot, null, 2),
);
console.log(
  JSON.stringify(
    {
      checkedAt: snapshot.checkedAt,
      sourceUpdatedAt: snapshot.sourceUpdatedAt,
      buildings: snapshot.buildings.map((b) => ({
        id: b.id,
        rsn: b.rsn,
        score: b.score,
        units: b.units,
        orders: b.orders?.length,
        categories: b.categories.length,
      })),
    },
    null,
    2,
  ),
);
