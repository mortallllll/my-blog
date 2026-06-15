'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  {
    name: '股市模拟',
    file: '股市模拟.html',
    description: '简易股票模拟系统 — 模拟股票买卖交易',
  },
  {
    name: '哥德巴赫猜想验证器',
    file: '哥德巴赫猜想验证器.html',
    description: '验证哥德巴赫猜想 — 超大数优化版',
  },
  {
    name: '冰语流光 · 励志语录',
    file: 'ice-quotes.html',
    description: '弹幕式励志语录展示 — 冰晶粒子背景、留言板、可添加/编辑语录',
  },
];

export default function WidgetsPage() {
  const [active, setActive] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = WIDGETS.find((w) => w.name === active);

  // 监听 ESC 退出全屏
  useEffect(() => {
    function onFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const enterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const toggleFullscreen = fullscreen ? exitFullscreen : enterFullscreen;

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
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {fullscreen ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    缩小
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    全屏
                  </>
                )}
              </button>
              <button
                onClick={() => setActive(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                ✕ 关闭
              </button>
            </div>
          </div>

          {/* iframe 容器（全屏目标） */}
          <div
            ref={containerRef}
            className={`overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${
              fullscreen ? 'flex items-center justify-center' : ''
            }`}
          >
            <iframe
              src={`/widgets/${current.file}`}
              title={current.name}
              className="w-full border-0"
              style={{
                height: fullscreen ? '100vh' : 'calc(100vh - 280px)',
                minHeight: fullscreen ? '100vh' : '600px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
