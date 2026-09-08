# WoodGreen Portfolio Monitor

A working RentSafe Compliance presentation dashboard built for WoodGreen Community Services. Includes a portfolio overview, searchable properties, building evaluation categories, listed orders and notices, durable change history, review acknowledgements, resource links, CSV export and print styling.

## Data and portfolio scope

- The initial researched scope is 21 selected WoodGreen property/program listings: 16 published addresses and five confidential program listings. It is not WoodGreen's entire 40+ property management portfolio.
- Fourteen addresses matched a unique City registration in the initial source check. Thirteen had published evaluations. No address is inferred for a confidential program.
- The portfolio register is `lib/portfolio.ts`. Every entry includes its official source. City registration and WoodGreen program unit counts are separate, especially for partnered operations and partial-building programs.
- Scores and category ratings come directly from City evaluation records. Bands follow the City's published 85/70 thresholds. Categories reflect the evaluation date, not an on-site check today.
- An order no longer appearing in the City layer is recorded as **no longer listed**, never as confirmed closed. The active layer does not establish a verified deadline or the full instructions of an order.
- Source URLs and dates are displayed in the dashboard. Sources are public; no tenant records or internal WoodGreen information are included.

## Real monitoring

`.github/workflows/monitor.yml` checks the City's registration, evaluation and MLS order feeds every six hours, at minute 17 UTC. It also runs manually and on changes to monitoring code. GitHub schedules are best effort and may be delayed. GitHub may disable schedules in public repositories after extended inactivity; review the Actions page if the snapshot becomes stale.

`scripts/monitor.ts` writes `data/monitor.json` with the latest successful snapshot, check status and up to 2,000 recorded changes. Source failures retain the previous snapshot, record a warning and fail the GitHub run. The scheduler uses Node 24 without dependency installation or external secrets.

The dashboard reads the public GitHub feed through its own server, retaining records and review state in D1. It checks for newer results when opened and every 15 minutes while visible. **Check sources** fetches the City directly. A database lease prevents overlapping refreshes from racing. Schema drift, incomplete registration responses, empty global order feeds and major count collapses stop updates.

Review flags mean a score below 85 or a listed Property Standards Order. A review acknowledgement only marks that dashboard change as reviewed. It does not change the City's record.

## Development

Requires Node 24 and npm.

```sh
npm ci
npm run db:generate
npx wrangler d1 migrations apply DB --local --config wrangler.local.json
npm run dev -- --port 5180
```

The generated migration in `drizzle/` is schema-only. Hosted deployments apply it through Sites. Database access is confined to `lib/monitor-store.ts`.

```sh
node --experimental-strip-types --test tests/monitor.test.ts
npx tsc --noEmit
npm run build
```

For a direct City check:

```sh
node --experimental-strip-types scripts/monitor.ts
```

## Hosting and access

The presentation is deployed privately through Sites. The source repository and its public-source monitoring feed are public. The private dashboard uses the hosting access gate; no separate customer accounts or signup forms are included. Do not grant shared editing access without reviewing who can acknowledge monitoring changes.

`.openai/hosting.json` contains logical database configuration and the hosting project ID, never credentials. The code can be adapted to another Cloudflare Workers deployment with D1. GitHub Pages alone does not run the server or database.

## Presentation boundaries

This is an independent RentSafe Compliance presentation, not a WoodGreen-operated or City-operated service. Confirm the complete operating portfolio and any address aliases with WoodGreen before expanding the monitoring scope. Consult the actual order and the City's owner portal for deadlines and required work.

Building photos are linked from WoodGreen's public website, with source attribution in each property record. They are not licensed as original project assets. No stock or generated building imagery is used.
