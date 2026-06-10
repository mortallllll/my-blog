'use client';

import { useEffect, useState } from 'react';

interface Props {
  slug: string;
  className?: string;
}

export default function ViewCounter({ slug, className }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function track() {
      try {
        // 记录阅读
        await fetch(`/api/views/${slug}`, { method: 'POST' });
        // 获取阅读量
        const res = await fetch(`/api/views/${slug}`);
        const data = await res.json();
        if (!cancelled) setCount(data.count || 0);
      } catch { /* 静默 */ }
    }
    track();
    return () => { cancelled = true; };
  }, [slug]);

  if (count === null) return null;

  return (
    <span className={className}>
      {count} 次阅读
    </span>
  );
}
