'use client';

import { useState, useMemo } from 'react';
import type { Post } from '@/lib/posts';

interface Props {
  posts: Post[];
  activeTag: string;
  onTagChange: (tag: string) => void;
}

export default function TagList({ posts, activeTag, onTagChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.meta.tags) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  // 根据搜索过滤
  const filtered = useMemo(() => {
    if (!query.trim()) return tagCounts;
    const q = query.toLowerCase();
    return tagCounts.filter(([tag]) => tag.toLowerCase().includes(q));
  }, [tagCounts, query]);

  // 折叠模式下只展示前 5 个
  const visible = expanded ? filtered : filtered.slice(0, 5);
  const hiddenCount = filtered.length - 5;

  if (tagCounts.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
        标签分类
      </h4>

      {/* 搜索框 */}
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!expanded) setExpanded(true);
          }}
          placeholder="搜索标签..."
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 pl-6 text-xs focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-500"
        />
        <svg
          className="absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 标签列表 */}
      <div className="flex flex-wrap gap-1.5">
        {/* 全部 */}
        <button
          onClick={() => onTagChange('')}
          className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
            !activeTag
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          全部
        </button>

        {visible.map(([tag, count]) => {
          const isActive = activeTag === tag;
          // 热度：2+ 篇加粗
          const hot = count >= 2;
          return (
            <button
              key={tag}
              onClick={() => onTagChange(isActive ? '' : tag)}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                hot ? 'font-medium' : 'opacity-60'
              } ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {tag}
              <span className="ml-0.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 展开 / 收起 */}
      {filtered.length > 5 && !query && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400"
        >
          {expanded ? '收起' : `展开全部 (${hiddenCount})`}
        </button>
      )}

      {/* 搜索无结果 */}
      {query && filtered.length === 0 && (
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          没有匹配的标签
        </p>
      )}
    </div>
  );
}
