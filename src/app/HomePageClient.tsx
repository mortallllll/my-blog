'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Post } from '@/lib/posts';
import { formatDateCN } from '@/lib/calendar';
import PostCard from '@/components/PostCard';
import Sidebar from '@/components/Sidebar';
import { useDebouncedCallback } from 'use-debounce';

/** 同步筛选状态到浏览器 URL（不触发导航） */
function syncUrl(search: string, tag: string, date: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  if (date) params.set('date', date);
  const qs = params.toString();
  const url = qs ? `/?${qs}` : '/';
  window.history.replaceState(null, '', url);
}

export default function HomePageClient({ allPosts }: { allPosts: Post[] }) {
  const searchParams = useSearchParams();

  const [search, setSearchRaw] = useState(searchParams.get('search') || '');
  const [tag, setTagRaw] = useState(searchParams.get('tag') || '');
  const [date, setDateRaw] = useState(searchParams.get('date') || '');

  // 同步浏览器前进/后退
  useEffect(() => {
    setSearchRaw(searchParams.get('search') || '');
    setTagRaw(searchParams.get('tag') || '');
    setDateRaw(searchParams.get('date') || '');
  }, [searchParams]);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    syncUrl(v, tag, date);
  }, [tag, date]);

  const setTag = useCallback((v: string) => {
    setTagRaw(v);
    syncUrl(search, v, date);
  }, [search, date]);

  const setDate = useCallback((v: string) => {
    setDateRaw(v);
    syncUrl(search, tag, v);
  }, [search, tag]);

  const clearAll = useCallback(() => {
    setSearchRaw('');
    setTagRaw('');
    setDateRaw('');
    syncUrl('', '', '');
  }, []);

  // 客户端即时过滤
  const posts = useMemo(() => {
    return allPosts.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.meta.title.toLowerCase().includes(q) &&
          !p.meta.description.toLowerCase().includes(q)
        )
          return false;
      }
      if (tag && !p.meta.tags.includes(tag)) return false;
      if (date && p.meta.date !== date) return false;
      return true;
    });
  }, [allPosts, search, tag, date]);

  const hasFilters = !!(search || tag || date);

  const handleSearchChange = useDebouncedCallback((term: string) => {
    setSearch(term);
  }, 300);

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4">
      {/* 左侧导航栏 */}
      <Sidebar
        posts={allPosts}
        activeTag={tag}
        activeDate={date}
        onTagChange={setTag}
        onDateChange={setDate}
      />

      {/* 正文 */}
      <div className="flex-1 min-w-0 py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            文章列表
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            分享技术和生活的个人博客
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="搜索文章..."
              defaultValue={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pl-10 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">筛选：</span>
            {search && (
              <Chip label={`搜索: ${search}`} onClear={() => setSearch('')} />
            )}
            {tag && (
              <Chip label={`标签: ${tag}`} onClear={() => setTag('')} />
            )}
            {date && (
              <Chip label={`日期: ${formatDateCN(date)}`} onClear={() => setDate('')} />
            )}
            <button
              onClick={clearAll}
              className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-1"
            >
              清除全部
            </button>
          </div>
        )}

        {/* Post Grid */}
        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              {hasFilters ? '没有匹配的文章' : '还没有文章'}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {hasFilters
                ? '请尝试其他筛选条件'
                : '管理员可以通过管理端发布新文章'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      {label}
      <button onClick={onClear} className="hover:text-blue-900 dark:hover:text-blue-100">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
