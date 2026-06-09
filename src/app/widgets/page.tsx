'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Widget {
  name: string;
  file: string;
  description: string;
}

const WIDGETS: Widget[] = [
  {
    name: '投资策略模拟器',
    file: '投资策略模拟器.html',
    description: '模拟不同投资策略的收益表现 — 支持固定金额/百分比策略，实时图表',
  },
];

// 添加更多组件时只需在此数组中追加即可
// {
//   name: '组件名',
//   file: '文件名.html',
//   description: '简短描述',
// },

export default function WidgetsPage() {
  const [active, setActive] = useState<string | null>(null);

  const current = WIDGETS.find((w) => w.name === active);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            组件管理
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            个人 HTML 小插件合集
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回首页
        </Link>
      </div>

      {/* 组件列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WIDGETS.map((w) => (
          <button
            key={w.name}
            onClick={() => setActive(active === w.name ? null : w.name)}
            className={`rounded-lg border p-4 text-left transition ${
              active === w.name
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600'
            }`}
          >
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              {w.name}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {w.description}
            </p>
          </button>
        ))}
      </div>

      {/* 组件展示 */}
      {current && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {current.name}
            </h2>
            <button
              onClick={() => setActive(null)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              ✕ 关闭
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <iframe
              src={`/widgets/${current.file}`}
              title={current.name}
              className="w-full border-0"
              style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
