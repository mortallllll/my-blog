'use client';

import { useMemo } from 'react';
import type { Post } from '@/lib/posts';

interface Props {
  posts: Post[];
  activeTag: string;
  onTagChange: (tag: string) => void;
}

export default function TagList({ posts, activeTag, onTagChange }: Props) {
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.meta.tags) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  if (tagCounts.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
        标签分类
      </h4>

      <div className="flex flex-wrap gap-1.5">
        {/* 全部 */}
        <button
          onClick={() => onTagChange('')}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
            !activeTag
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          全部
          <span className="ml-1 opacity-70">{posts.length}</span>
        </button>

        {/* 各标签 */}
        {tagCounts.map(([tag, count]) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => onTagChange(isActive ? '' : tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {tag}
              <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
