'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  contentHtml: string;
}

/** 从 HTML 内容中提取 h2/h3 标题 */
function extractHeadings(html: string): Heading[] {
  const result: Heading[] = [];
  // 用正则匹配所有 h2/h3 标签
  const regex = /<h([23])\b[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const inner = match[2].replace(/<[^>]+>/g, '').trim(); // 去掉内部 span/link 等
    if (!inner) continue;
    const id = inner
      .replace(/[^\w一-鿿]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 50);
    result.push({ id, text: inner, level });
  }
  return result;
}

export default function TableOfContents({ contentHtml }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const headings = extractHeadings(contentHtml);

  // 监听滚动，高亮当前章节
  useEffect(() => {
    if (headings.length === 0) return;

    function onScroll() {
      const scrollY = window.scrollY + 80; // 偏移量
      let current = headings[0]?.id || '';
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.offsetTop <= scrollY) {
          current = h.id;
        }
      }
      setActiveId(current);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block fixed right-[max(1rem,calc((100vw-48rem)/2-12rem))] top-24 w-44 max-h-[70vh] overflow-y-auto">
      <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
        目录
      </h4>
      <ul className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-700">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-xs py-1 transition-colors leading-snug ${
                h.level === 3 ? 'pl-4' : 'pl-3'
              } ${
                activeId === h.id
                  ? 'text-blue-600 font-medium border-l-2 -ml-px border-blue-500 dark:text-blue-400 dark:border-blue-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
