'use client';

import { emitOpenDrawer } from '@/components/MobileDrawer';

/** 导航栏内的汉堡按钮 — 仅移动端显示 */
export function MobileMenuBtn() {
  return (
    <button
      onClick={() => emitOpenDrawer()}
      className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 transition dark:text-zinc-400 dark:hover:bg-zinc-800"
      aria-label="打开侧边栏"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
