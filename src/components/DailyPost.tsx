'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/posts';

interface Props {
  posts: Post[];
}

export default function DailyPost({ posts }: Props) {
  const randomPick = useCallback((exclude?: Post) => {
    if (posts.length <= 1) return posts[0];
    let pick: Post;
    do {
      pick = posts[Math.floor(Math.random() * posts.length)];
    } while (pick === exclude && posts.length > 1);
    return pick;
  }, [posts]);

  const [current, setCurrent] = useState(() => randomPick());

  const handleRefresh = () => {
    setCurrent(randomPick(current));
  };

  if (posts.length === 0) return null;

  return (
    <div className="mb-8 rounded-lg border-l-4 border-amber-400 bg-amber-50/50 p-4 dark:border-amber-500 dark:bg-amber-950/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          📖 每日一文
        </span>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition dark:text-amber-400 dark:hover:text-amber-300"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          换一篇
        </button>
      </div>
      <Link href={`/post/${current.slug}`} className="group block">
        <h3 className="text-sm font-semibold text-zinc-800 group-hover:text-amber-600 transition dark:text-zinc-200 dark:group-hover:text-amber-400">
          {current.meta.title}
        </h3>
        {current.meta.description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
            {current.meta.description}
          </p>
        )}
      </Link>
    </div>
  );
}
