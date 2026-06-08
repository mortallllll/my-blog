import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, updatePost, deletePost, PostMeta } from '@/lib/posts';
import { isAuthenticated } from '@/lib/auth';

/** GET /api/posts/[slug] — get a single post */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  return NextResponse.json(post);
}

/** PUT /api/posts/[slug] — update a post (admin only) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const body = await request.json();
    const { meta, content } = body as { meta: PostMeta; content: string };

    if (!meta?.title || content === undefined) {
      return NextResponse.json(
        { error: '缺少必要字段 (meta.title, content)' },
        { status: 400 }
      );
    }

    const post = await updatePost(slug, meta, content);
    return NextResponse.json(post);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '更新失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** DELETE /api/posts/[slug] — delete a post (admin only) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { slug } = await params;
  const success = await deletePost(slug);

  if (!success) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
