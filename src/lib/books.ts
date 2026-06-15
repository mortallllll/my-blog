import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const BOOKS_JSON_PATH = path.join(process.cwd(), 'content', 'books.json');

// KV key prefixes
const KV_BOOKS_SLUGS_KEY = 'books:slugs';
const KV_BOOK_PREFIX = 'books:';

export interface BookMeta {
  author: string;
  cover: string;
  rating: number;       // 1-5
  status: 'done' | 'reading' | 'want';
  review: string;
  tags: string[];
  recommend: boolean;
}

export interface Book {
  slug: string;
  meta: BookMeta;
  createdAt: string;
  updatedAt: string;
}

/** Validate slug to prevent path traversal */
function safeSlug(slug: string): string {
  const sanitized = slug.replace(/\.\./g, '').replace(/[\\\/]/g, '-');
  if (!sanitized || sanitized.length > 100) {
    throw new Error('Invalid slug');
  }
  return sanitized;
}

/** Check if KV storage is available (only on Vercel with proper env vars) */
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ========== File-based storage (local dev fallback) ==========

function fileReadAllBooks(): Book[] {
  if (!fs.existsSync(BOOKS_JSON_PATH)) return [];

  try {
    const raw = fs.readFileSync(BOOKS_JSON_PATH, 'utf-8');
    const books: Book[] = JSON.parse(raw);
    if (!Array.isArray(books)) return [];
    return books;
  } catch {
    return [];
  }
}

function fileWriteAllBooks(books: Book[]): void {
  const dir = path.dirname(BOOKS_JSON_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(BOOKS_JSON_PATH, JSON.stringify(books, null, 2), 'utf-8');
}

function fileGetAllBooks(): Book[] {
  const books = fileReadAllBooks();
  return books.sort((a, b) => {
    // 精选优先
    if (a.meta.recommend && !b.meta.recommend) return -1;
    if (!a.meta.recommend && b.meta.recommend) return 1;
    // 然后按更新日期倒序
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function fileGetBookBySlug(slug: string): Book | null {
  const books = fileReadAllBooks();
  return books.find((b) => b.slug === slug) || null;
}

function fileCreateBook(slug: string, meta: BookMeta): Book {
  const books = fileReadAllBooks();
  if (books.some((b) => b.slug === slug)) {
    throw new Error('书籍已存在');
  }

  const now = new Date().toISOString();
  const book: Book = { slug, meta, createdAt: now, updatedAt: now };
  books.push(book);
  fileWriteAllBooks(books);
  return book;
}

function fileUpdateBook(slug: string, meta: BookMeta): Book {
  const books = fileReadAllBooks();
  const idx = books.findIndex((b) => b.slug === slug);
  if (idx === -1) throw new Error('书籍不存在');

  const now = new Date().toISOString();
  const book: Book = {
    slug,
    meta,
    createdAt: books[idx].createdAt,
    updatedAt: now,
  };
  books[idx] = book;
  fileWriteAllBooks(books);
  return book;
}

function fileDeleteBook(slug: string): boolean {
  const books = fileReadAllBooks();
  const idx = books.findIndex((b) => b.slug === slug);
  if (idx === -1) return false;
  books.splice(idx, 1);
  fileWriteAllBooks(books);
  return true;
}

// ========== KV-based storage (Vercel production) ==========

async function kvGetAllBooks(): Promise<Book[]> {
  // Auto-seed from files if KV is empty
  const existingCount = await kv.scard(KV_BOOKS_SLUGS_KEY);
  if (existingCount === 0) {
    const books = fileReadAllBooks();
    for (const book of books) {
      await kv.set(`${KV_BOOK_PREFIX}${book.slug}`, book);
      await kv.sadd(KV_BOOKS_SLUGS_KEY, book.slug);
    }
  }

  const slugs: string[] = (await kv.smembers(KV_BOOKS_SLUGS_KEY)) || [];

  const books: Book[] = [];
  for (const slug of slugs) {
    const book = await kvGetBookBySlug(slug);
    if (book) books.push(book);
  }

  return books.sort((a, b) => {
    if (a.meta.recommend && !b.meta.recommend) return -1;
    if (!a.meta.recommend && b.meta.recommend) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

async function kvGetBookBySlug(slug: string): Promise<Book | null> {
  const data = await kv.get<Book>(`${KV_BOOK_PREFIX}${slug}`);
  return data || null;
}

async function kvCreateBook(slug: string, meta: BookMeta): Promise<Book> {
  const exists = await kv.exists(`${KV_BOOK_PREFIX}${slug}`);
  if (exists) throw new Error('书籍已存在');

  const now = new Date().toISOString();
  const book: Book = { slug, meta, createdAt: now, updatedAt: now };
  await kv.set(`${KV_BOOK_PREFIX}${slug}`, book);
  await kv.sadd(KV_BOOKS_SLUGS_KEY, slug);
  return book;
}

async function kvUpdateBook(slug: string, meta: BookMeta): Promise<Book> {
  const existing = await kv.get<Book>(`${KV_BOOK_PREFIX}${slug}`);
  if (!existing) throw new Error('书籍不存在');

  const now = new Date().toISOString();
  const book: Book = {
    slug,
    meta,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  await kv.set(`${KV_BOOK_PREFIX}${slug}`, book);
  return book;
}

async function kvDeleteBook(slug: string): Promise<boolean> {
  const deleted = await kv.del(`${KV_BOOK_PREFIX}${slug}`);
  await kv.srem(KV_BOOKS_SLUGS_KEY, slug);
  return deleted > 0;
}

// ========== Public API (auto-selects storage backend) ==========

/** Read all books, sorted: recommend first, then updatedAt desc */
export async function getAllBooks(): Promise<Book[]> {
  if (isKvAvailable()) {
    return kvGetAllBooks();
  }
  return fileGetAllBooks();
}

/** Read a single book by slug */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvGetBookBySlug(safe);
  }
  return fileGetBookBySlug(safe);
}

/** Create a new book */
export async function createBook(slug: string, meta: BookMeta): Promise<Book> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvCreateBook(safe, meta);
  }
  return fileCreateBook(safe, meta);
}

/** Update an existing book */
export async function updateBook(slug: string, meta: BookMeta): Promise<Book> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvUpdateBook(safe, meta);
  }
  return fileUpdateBook(safe, meta);
}

/** Delete a book */
export async function deleteBook(slug: string): Promise<boolean> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvDeleteBook(safe);
  }
  return fileDeleteBook(safe);
}

// ========== Seed initial data to KV (call on first deploy) ==========

/** Sync content/books.json into KV store (incremental — only adds new) */
export async function seedBooksKvFromFiles(): Promise<number> {
  if (!isKvAvailable()) return 0;

  const books = fileReadAllBooks();
  let count = 0;

  for (const book of books) {
    const exists = await kv.exists(`${KV_BOOK_PREFIX}${book.slug}`);
    if (!exists) {
      await kv.set(`${KV_BOOK_PREFIX}${book.slug}`, book);
      await kv.sadd(KV_BOOKS_SLUGS_KEY, book.slug);
      count++;
    }
  }
  return count;
}
