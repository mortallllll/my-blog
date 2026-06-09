'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Post } from '@/lib/posts';

interface Props {
  posts: Post[];
}

/** 构建筛选 URL：保留现有参数并添加/覆盖指定 key */
function buildUrl(
  currentParams: URLSearchParams,
  set: Record<string, string | null>
): string {
  const params = new URLSearchParams(currentParams.toString());
  for (const [key, value] of Object.entries(set)) {
    params.delete(key);
    if (value !== null) params.set(key, value);
  }
  // 过滤掉空的 search 参数
  if (!params.get('search')) params.delete('search');
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

export default function TagList({ posts }: Props) {
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag') || '';

  // 提取标签及其文章计数
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
        <Link
          href={buildUrl(searchParams, { tag: null })}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
            !activeTag
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          全部
          <span className="ml-1 opacity-70">{posts.length}</span>
        </Link>

        {/* 各标签 */}
        {tagCounts.map(([tag, count]) => {
          const isActive = activeTag === tag;
          return (
            <Link
              key={tag}
              href={buildUrl(searchParams, { tag: isActive ? null : tag })}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {tag}
              <span className="ml-1 opacity-70">{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
