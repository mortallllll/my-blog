import { NextRequest, NextResponse } from 'next/server';
import { getAllBooks, createBook, BookMeta } from '@/lib/books';
import { isAuthenticated } from '@/lib/auth';

/** GET /api/books — list all books */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') || '';

  let books = await getAllBooks();

  if (search) {
    const keyword = search.toLowerCase();
    books = books.filter(
      (b) =>
        b.slug.toLowerCase().includes(keyword) ||
        b.meta.author.toLowerCase().includes(keyword) ||
        b.meta.review.toLowerCase().includes(keyword)
    );
  }

  return NextResponse.json(books);
}

/** POST /api/books — create a new book (admin only) */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, meta } = body as { slug: string; meta: BookMeta };

    if (!slug || !meta?.author) {
      return NextResponse.json(
        { error: '缺少必要字段 (slug, meta.author)' },
        { status: 400 }
      );
    }

    const book = await createBook(slug, meta);
    return NextResponse.json(book, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '创建失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
