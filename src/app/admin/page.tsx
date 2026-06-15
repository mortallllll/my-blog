'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import PostEditor from '@/components/PostEditor';
import BookEditor from '@/components/BookEditor';
import { useToast } from '@/components/Toast';
import type { Post, PostMeta } from '@/lib/posts';
import type { Book, BookMeta } from '@/lib/books';

type ViewMode = 'list' | 'create' | 'edit';
type ContentType = 'posts' | 'books';

/** Top-level: wrap with AdminGuard + Suspense (needed for useSearchParams) */
export default function AdminDashboard() {
  return (
    <AdminGuard>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </AdminGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Content type from URL param (default: posts)
  const contentType: ContentType =
    (searchParams.get('type') as ContentType) || 'posts';

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Books state
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Search
  const [search, setSearch] = useState('');

  const loading = contentType === 'posts' ? loadingPosts : loadingBooks;

  // ── Fetch helpers ──
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchBooks();
  }, [fetchPosts, fetchBooks]);

  // ── Switch content type ──
  const switchType = (t: ContentType) => {
    if (t !== contentType) {
      setViewMode('list');
      setEditingPost(null);
      setEditingBook(null);
      setSearch('');
      router.replace(`/admin?type=${t}`);
    }
  };

  // ── Post handlers ──
  const handlePostCreate = async (data: {
    slug: string;
    meta: PostMeta;
    content: string;
  }) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '创建失败');
    }
    toast('文章已发布');
    setViewMode('list');
    fetchPosts();
  };

  const handlePostUpdate = async (data: {
    slug: string;
    meta: PostMeta;
    content: string;
  }) => {
    const res = await fetch(`/api/posts/${editingPost!.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: data.meta, content: data.content }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '更新失败');
    }
    toast('文章已更新');
    setViewMode('list');
    setEditingPost(null);
    fetchPosts();
  };

  const handlePostDelete = async () => {
    setViewMode('list');
    setEditingPost(null);
    fetchPosts();
  };

  // ── Book handlers ──
  const handleBookCreate = async (data: { slug: string; meta: BookMeta }) => {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '创建失败');
    }
    toast('书籍已添加');
    setViewMode('list');
    fetchBooks();
  };

  const handleBookUpdate = async (data: { slug: string; meta: BookMeta }) => {
    const res = await fetch(`/api/books/${editingBook!.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: data.meta }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '更新失败');
    }
    toast('书籍已更新');
    setViewMode('list');
    setEditingBook(null);
    fetchBooks();
  };

  const handleBookDelete = async () => {
    setViewMode('list');
    setEditingBook(null);
    fetchBooks();
  };

  // ── Logout ──
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  // ── Render: Create Mode ──
  if (viewMode === 'create') {
    const isBook = contentType === 'books';
    const title = isBook ? '添加书籍' : '新建文章';
    return (
      <div>
        {/* Segment control */}
        <SegmentControl contentType={contentType} onSwitch={switchType} />
        <div className="mb-6 mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          <button
            onClick={() => setViewMode('list')}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 transition dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300"
          >
            返回列表
          </button>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {isBook ? (
            <BookEditor onSave={handleBookCreate} />
          ) : (
            <PostEditor onSave={handlePostCreate} />
          )}
        </div>
      </div>
    );
  }

  // ── Render: Edit Mode ──
  if (viewMode === 'edit') {
    const isBook = contentType === 'books';
    const title = isBook ? '编辑书籍' : '编辑文章';
    const item = isBook ? editingBook : editingPost;
    if (!item) {
      setViewMode('list');
      return null;
    }
    return (
      <div>
        <SegmentControl contentType={contentType} onSwitch={switchType} />
        <div className="mb-6 mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          <button
            onClick={() => {
              setViewMode('list');
              isBook ? setEditingBook(null) : setEditingPost(null);
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 transition dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300"
          >
            返回列表
          </button>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {isBook ? (
            <BookEditor
              book={editingBook as Book}
              onSave={handleBookUpdate}
              onDelete={handleBookDelete}
            />
          ) : (
            <PostEditor
              post={editingPost as Post}
              onSave={handlePostUpdate}
              onDelete={handlePostDelete}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Render: List Mode ──
  const isBook = contentType === 'books';

  // Search filter
  const filteredPosts = search.trim()
    ? posts.filter(
        (p) =>
          p.meta.title.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const filteredBooks = search.trim()
    ? books.filter(
        (b) =>
          b.slug.toLowerCase().includes(search.toLowerCase()) ||
          b.meta.author.toLowerCase().includes(search.toLowerCase())
      )
    : books;

  const createLabel = isBook ? '+ 添加书籍' : '+ 新建文章';
  const listTitle = isBook ? '书籍管理' : '文章管理';
  const listCount = isBook ? books.length : posts.length;
  const listUnit = isBook ? '本书' : '篇文章';
  const searchPlaceholder = isBook
    ? '搜索书名或作者…'
    : '搜索文章标题或 URL…';
  const emptyIcon = isBook ? '📚' : '📝';
  const emptyText = isBook
    ? '还没有书籍，点击上方按钮添加第一本'
    : '还没有文章，点击上方按钮创建第一篇';

  return (
    <div>
      {/* Segment control */}
      <div className="mb-6">
        <SegmentControl contentType={contentType} onSwitch={switchType} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {listTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            共 {listCount} {listUnit}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('create')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            {createLabel}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            登出
          </button>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            查看网站 →
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
        </div>
      ) : isBook ? (
        /* ─── Books table ─── */
        filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">{emptyIcon}</div>
            <p className="text-zinc-500 dark:text-zinc-400">{emptyText}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    书名
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    作者
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    状态
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    精选
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr
                    key={book.slug}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {book.slug}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
                        {book.meta.review || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {book.meta.author}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={book.meta.status} />
                    </td>
                    <td className="px-4 py-3">
                      {book.meta.recommend ? (
                        <span className="text-amber-400">⭐</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingBook(book);
                            setViewMode('edit');
                          }}
                          className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          编辑
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`确定删除「${book.slug}」？`)) return;
                            await fetch(`/api/books/${book.slug}`, { method: 'DELETE' });
                            toast('书籍已删除');
                            fetchBooks();
                          }}
                          className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ─── Posts table ─── */
        filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">{emptyIcon}</div>
            <p className="text-zinc-500 dark:text-zinc-400">{emptyText}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    标题
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    日期
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    状态
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr
                    key={post.slug}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {post.meta.pinned && '📌 '}{post.meta.title}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        /{post.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {post.meta.date}
                    </td>
                    <td className="px-4 py-3">
                      {post.meta.draft ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                          草稿
                        </span>
                      ) : (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                          已发布
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setViewMode('edit');
                          }}
                          className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          编辑
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`确定删除「${post.meta.title}」？`)) return;
                            await fetch(`/api/posts/${post.slug}`, { method: 'DELETE' });
                            toast('文章已删除');
                            fetchPosts();
                          }}
                          className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ── Segment control ──
function SegmentControl({
  contentType,
  onSwitch,
}: {
  contentType: ContentType;
  onSwitch: (t: ContentType) => void;
}) {
  const items: { key: ContentType; label: string; emoji: string }[] = [
    { key: 'posts', label: '文章', emoji: '📝' },
    { key: 'books', label: '书籍', emoji: '📚' },
  ];

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onSwitch(item.key)}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
            contentType === item.key
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          {item.emoji} {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Status badge for books ──
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    done: { label: '已读', cls: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' },
    reading: { label: '在读', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' },
    want: { label: '想读', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' },
  };
  const info = map[status] || { label: status, cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400' };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
}
