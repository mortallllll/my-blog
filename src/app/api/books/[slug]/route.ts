import { NextRequest, NextResponse } from 'next/server';
import { getBookBySlug, updateBook, deleteBook, BookMeta } from '@/lib/books';
import { isAuthenticated } from '@/lib/auth';

/** GET /api/books/[slug] — get a single book */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return NextResponse.json({ error: '书籍不存在' }, { status: 404 });
  }

  return NextResponse.json(book);
}

/** PUT /api/books/[slug] — update a book (admin only) */
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
    const { meta } = body as { meta: BookMeta };

    if (!meta?.author) {
      return NextResponse.json(
        { error: '缺少必要字段 (meta.author)' },
        { status: 400 }
      );
    }

    const book = await updateBook(slug, meta);
    return NextResponse.json(book);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '更新失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** DELETE /api/books/[slug] — delete a book (admin only) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { slug } = await params;
  const success = await deleteBook(slug);

  if (!success) {
    return NextResponse.json({ error: '书籍不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
