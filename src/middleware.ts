import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** 单 IP 每分钟最多评论数 */
const MAX_COMMENTS_PER_MIN = 10;

/** 内存计数器（Edge 环境冷启频繁，过期条目随实例回收） */
const ipCounters = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  // 只拦截评论 POST 请求
  if (
    request.method === 'POST' &&
    request.nextUrl.pathname.startsWith('/api/comments/')
  ) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const now = Date.now();
    const key = `comment:${ip}`;
    const entry = ipCounters.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= MAX_COMMENTS_PER_MIN) {
        return NextResponse.json(
          { error: '发送太频繁，请稍后再试' },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      ipCounters.set(key, { count: 1, resetAt: now + 60_000 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/comments/:path*',
};
