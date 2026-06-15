'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Book, BookMeta } from '@/lib/books';
import BookCard from '@/components/BookCard';

const ALL_STATUSES: BookMeta['status'][] = ['done', 'reading', 'want'];

const STATUS_LABELS: Record<string, string> = {
  done: '已读',
  reading: '在读',
  want: '想读',
};

interface Props {
  allBooks: Book[];
}

export default function BooksPageClient({ allBooks }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTag, setActiveTag] = useState<string>('');

  // Compute stats
  const stats = useMemo(() => {
    const total = allBooks.length;
    const done = allBooks.filter((b) => b.meta.status === 'done').length;
    const reading = allBooks.filter((b) => b.meta.status === 'reading').length;
    const want = allBooks.filter((b) => b.meta.status === 'want').length;
    const recommend = allBooks.filter((b) => b.meta.recommend).length;
    return { total, done, reading, want, recommend };
  }, [allBooks]);

  // Tag frequency map
  const tags = useMemo(() => {
    const map = new Map<string, number>();
    allBooks.forEach((b) => {
      b.meta.tags.forEach((t) => {
        map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allBooks]);

  // Filtered books
  const filtered = useMemo(() => {
    let books = allBooks;
    if (statusFilter !== 'all') {
      books = books.filter((b) => b.meta.status === statusFilter);
    }
    if (activeTag) {
      books = books.filter((b) => b.meta.tags.includes(activeTag));
    }
    return books;
  }, [allBooks, statusFilter, activeTag]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag === activeTag ? '' : tag);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            📚 书架
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            分享读过的好书，记录阅读轨迹
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回首页
        </Link>
      </div>

      {/* Stats bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          共 <strong className="text-zinc-900 dark:text-zinc-100">{stats.total}</strong> 本
        </span>
        <span>
          已读 <strong className="text-zinc-900 dark:text-zinc-100">{stats.done}</strong>
        </span>
        <span>
          在读 <strong className="text-zinc-900 dark:text-zinc-100">{stats.reading}</strong>
        </span>
        <span>
          想读 <strong className="text-zinc-900 dark:text-zinc-100">{stats.want}</strong>
        </span>
        <span>
          精选 <strong className="text-amber-500">{stats.recommend}</strong>
        </span>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            statusFilter === 'all'
              ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
          }`}
        >
          全部
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === s
                ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTag('')}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
              !activeTag
                ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
            }`}
          >
            全部
          </button>
          {tags.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                activeTag === tag
                  ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              {tag} <span className="opacity-50">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Book cards grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            {allBooks.length === 0 ? '还没有书籍' : '没有匹配的书籍'}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {allBooks.length === 0
              ? '管理员可以通过管理端添加书籍分享'
              : '请尝试其他筛选条件'}
          </p>
        </div>
      )}
    </div>
  );
}
