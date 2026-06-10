'use client';

import { useEffect, useState } from 'react';

interface Props {
  slug: string;
  className?: string;
  /** 是否记录阅读（仅文章详情页为 true） */
  track?: boolean;
}

export default function ViewCounter({ slug, className, track = false }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (track) {
          await fetch(`/api/views/${slug}`, { method: 'POST' });
        }
        const res = await fetch(`/api/views/${slug}`);
        const data = await res.json();
        if (!cancelled) setCount(data.count || 0);
      } catch { /* 静默 */ }
    }
    load();
    return () => { cancelled = true; };
  }, [slug, track]);

  if (count === null) return null;

  return <span className={className}>{count} 次阅读</span>;
}
