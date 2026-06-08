import { NextResponse } from 'next/server';
import { seedKvFromFiles } from '@/lib/posts';
import { isAuthenticated } from '@/lib/auth';

/** POST /api/seed — sync content/*.md files into KV storage (admin only) */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const count = await seedKvFromFiles();
    return NextResponse.json({ success: true, synced: count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '同步失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
