'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Post } from '@/lib/posts';
import ContributionCalendar from '@/components/ContributionCalendar';
import TagList from '@/components/TagList';

interface Props {
  posts: Post[];
  activeTag: string;
  activeDate: string;
  onTagChange: (tag: string) => void;
  onDateChange: (date: string) => void;
}

export default function Sidebar({
  posts,
  activeTag,
  activeDate,
  onTagChange,
  onDateChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((v) => !v);
  }, []);

  // 统计
  const stats = useMemo(() => {
    const total = posts.length;
    let days = 0;
    if (posts.length > 0) {
      const sorted = [...posts].sort(
        (a, b) =>
          new Date(a.meta.date).getTime() - new Date(b.meta.date).getTime()
      );
      const first = new Date(sorted[0].meta.date + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      days = Math.max(1, Math.ceil((now.getTime() - first.getTime()) / 86400000));
    }
    return { total, days };
  }, [posts]);

  return (
    <>
      {/* 折叠时：窄条 + 展开按钮 */}
      {collapsed ? (
        <aside className="w-8 shrink-0 pt-8 pb-8 hidden lg:flex flex-col items-center">
          <button
            onClick={toggle}
            title="展开侧边栏"
            className="sticky top-20 mt-1 rounded p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </aside>
      ) : (
        /* 展开时：完整侧边栏 */
        <aside className="w-56 shrink-0 pt-8 pb-8 hidden lg:block">
          <div className="sticky top-20 space-y-5">
            {/* 收起按钮 + 统计 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {stats.total}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">文章</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {stats.days}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">天</span>
                </div>
              </div>
              <button
                onClick={toggle}
                title="收起侧边栏"
                className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* 日历 */}
            <ContributionCalendar
              posts={posts}
              activeDate={activeDate}
              onDateChange={onDateChange}
            />

            <hr className="border-zinc-200 dark:border-zinc-700" />

            {/* 标签 */}
            <TagList
              posts={posts}
              activeTag={activeTag}
              onTagChange={onTagChange}
            />
          </div>
        </aside>
      )}
    </>
  );
}
