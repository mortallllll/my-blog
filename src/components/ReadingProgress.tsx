'use client';

import { useEffect, useState } from 'react';

/** 估算中文文章阅读时长（约 400 字/分钟） */
export function estimateReadingTime(text: string): number {
  // 去掉 markdown 语法和空白，统计有效字符
  const cleaned = text
    .replace(/[#*`~>\-\[\]()|!]/g, '')
    .replace(/\s+/g, '');
  const chars = cleaned.length;
  return Math.max(1, Math.round(chars / 400));
}

interface Props {
  content: string;
}

export default function ReadingProgress({ content }: Props) {
  const [progress, setProgress] = useState(0);
  const minutes = estimateReadingTime(content);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(100);
        return;
      }
      setProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 z-[60] h-0.5 bg-blue-500 transition-all duration-150" style={{ width: `${progress}%` }} />

      {/* 阅读时长提示 */}
      <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
        约 {minutes} 分钟阅读
      </span>
    </>
  );
}
