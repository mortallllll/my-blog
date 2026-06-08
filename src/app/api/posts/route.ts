import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, createPost, PostMeta } from '@/lib/posts';
import { isAuthenticated } from '@/lib/auth';

/** GET /api/posts — list all posts (admin: including drafts) */
export async function GET(request: NextRequest) {
  const admin = await isAuthenticated();
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') || '';

  let posts = await getAllPosts(admin);

  if (search) {
    const keyword = search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.meta.title.toLowerCase().includes(keyword) ||
        p.meta.description.toLowerCase().includes(keyword)
    );
  }

  return NextResponse.json(posts);
}

/** POST /api/posts — create a new post (admin only) */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, meta, content } = body as {
      slug: string;
      meta: PostMeta;
      content: string;
    };

    if (!slug || !meta?.title || content === undefined) {
      return NextResponse.json(
        { error: '缺少必要字段 (slug, meta.title, content)' },
        { status: 400 }
      );
    }

    const post = await createPost(slug, meta, content);
    return NextResponse.json(post, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '创建失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
