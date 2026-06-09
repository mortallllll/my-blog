'use client';

import { useMemo } from 'react';
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
  // 统计：总文章数 + 距首篇文章天数
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
    <aside className="w-56 shrink-0 pt-8 pb-8 hidden lg:block">
      <div className="sticky top-20 space-y-5">
        {/* 统计数字 */}
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

        {/* 日历热力图 */}
        <ContributionCalendar
          posts={posts}
          activeDate={activeDate}
          onDateChange={onDateChange}
        />

        {/* 分隔线 */}
        <hr className="border-zinc-200 dark:border-zinc-700" />

        {/* 标签分类 */}
        <TagList
          posts={posts}
          activeTag={activeTag}
          onTagChange={onTagChange}
        />
      </div>
    </aside>
  );
}
