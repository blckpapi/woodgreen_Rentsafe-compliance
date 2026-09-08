import { readMonitor, setReviewed } from '@/lib/monitor-store';
const response = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const sameOrigin = (request: Request) =>
  !request.headers.get('origin') ||
  request.headers.get('origin') === new URL(request.url).origin;
export async function GET() {
  try {
    return response(await readMonitor());
  } catch {
    return response({ error: 'Monitoring storage is not available.' }, 503);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return response({ error: 'Origin not allowed.' }, 403);
  try {
    return response(await readMonitor(true));
  } catch {
    return response({ error: 'Source check could not be completed.' }, 503);
  }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request))
    return response({ error: 'Origin not allowed.' }, 403);
  try {
    const body = (await request.json()) as { id?: unknown; reviewed?: unknown };
    if (
      typeof body.id !== 'string' ||
      body.id.length > 1500 ||
      typeof body.reviewed !== 'boolean'
    )
      return response({ error: 'Invalid review request.' }, 400);
    return (await setReviewed(body.id, body.reviewed))
      ? response({ saved: true })
      : response({ error: 'Change not found.' }, 404);
  } catch {
    return response({ error: 'Review could not be saved.' }, 500);
  }
}
