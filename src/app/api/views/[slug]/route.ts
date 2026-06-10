import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

function viewKey(slug: string) { return `views:${slug}`; }
function isKvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** POST /api/views/[slug] — 记录一次阅读 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (isKvAvailable()) {
    await kv.incr(viewKey(slug));
  }
  return NextResponse.json({ ok: true });
}

/** GET /api/views/[slug] — 获取阅读量 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let count = 0;
  if (isKvAvailable()) {
    const val = await kv.get<number>(viewKey(slug));
    count = val || 0;
  }
  return NextResponse.json({ count });
}
