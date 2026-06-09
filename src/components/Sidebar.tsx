'use client';

import { useEffect, useState } from 'react';
import type { Post } from '@/lib/posts';
import ContributionCalendar from '@/components/ContributionCalendar';

export default function Sidebar() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  return (
    <aside className="w-60 shrink-0 pt-8 pb-8 hidden lg:block">
      <div className="sticky top-20 space-y-8">
        {/* 文章发布日历 */}
        <ContributionCalendar posts={posts} />

        {/* 分隔线 */}
        <hr className="border-zinc-200 dark:border-zinc-700" />

        {/* 标签分类（占位） */}
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
            标签分类
          </h4>
          <p className="text-xs text-zinc-300 dark:text-zinc-600 italic">
            即将推出…
          </p>
        </div>
      </div>
    </aside>
  );
}
