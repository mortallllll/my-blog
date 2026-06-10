import { NextRequest, NextResponse } from 'next/server';
import { getComments, addComment, deleteComment } from '@/lib/comments';
import { isAuthenticated } from '@/lib/auth';
import { checkSensitive } from '@/lib/moderation';

/** GET /api/comments/[slug] — 获取评论列表 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const comments = await getComments(slug);
  return NextResponse.json(comments);
}

/** POST /api/comments/[slug] — 发布评论 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();
    const { nickname, content } = body;

    if (!nickname?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '昵称和内容不能为空' }, { status: 400 });
    }

    if (nickname.trim().length > 30) {
      return NextResponse.json({ error: '昵称最长 30 字' }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: '内容最长 2000 字' }, { status: 400 });
    }

    const hit = checkSensitive(nickname.trim()) || checkSensitive(content.trim());
    if (hit) {
      return NextResponse.json({ error: `内容包含不适当用语，请修改后重试` }, { status: 400 });
    }

    const comment = await addComment(slug, nickname.trim(), content.trim());
    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: '发布失败' }, { status: 500 });
  }
}

/** DELETE /api/comments/[slug]?id=xxx — 管理员删除评论 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { slug } = await params;
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少评论 ID' }, { status: 400 });
  }

  const ok = await deleteComment(slug, id);
  if (!ok) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
