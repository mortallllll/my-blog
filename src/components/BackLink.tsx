'use client';

import { useRouter } from 'next/navigation';

export default function BackLink() {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // 有浏览器历史记录则返回，否则跳首页
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <a
      href="/"
      onClick={handleBack}
      className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition dark:text-zinc-400 dark:hover:text-zinc-200"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      返回文章列表
    </a>
  );
}
