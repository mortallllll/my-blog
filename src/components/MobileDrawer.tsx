'use client';

import { useState, useCallback } from 'react';
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

export default function MobileDrawer({
  posts,
  activeTag,
  activeDate,
  onTagChange,
  onDateChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* 汉堡按钮 — 移动端固定左上角 */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm shadow border border-zinc-200 text-zinc-600 active:bg-zinc-100 transition dark:bg-zinc-900/80 dark:border-zinc-700 dark:text-zinc-400 dark:active:bg-zinc-800"
        aria-label="打开侧边栏"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 遮罩层 */}
      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto animate-slide-in">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                导航
              </span>
              <button
                onClick={close}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* 统计数字 */}
              <StatsInline posts={posts} />

              {/* 日历 */}
              <ContributionCalendar
                posts={posts}
                activeDate={activeDate}
                onDateChange={(d) => { onDateChange(d); close(); }}
              />

              <hr className="border-zinc-200 dark:border-zinc-700" />

              {/* 标签 */}
              <TagList
                posts={posts}
                activeTag={activeTag}
                onTagChange={(t) => { onTagChange(t); close(); }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** 移动端的行内统计数字 */
function StatsInline({ posts }: { posts: Post[] }) {
  const sorted = [...posts].sort(
    (a, b) => new Date(a.meta.date).getTime() - new Date(b.meta.date).getTime()
  );
  const total = posts.length;
  let days = 0;
  if (posts.length > 0) {
    const first = new Date(sorted[0].meta.date + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    days = Math.max(1, Math.ceil((now.getTime() - first.getTime()) / 86400000));
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{total}</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">文章</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{days}</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">天</span>
      </div>
    </div>
  );
}
