'use client';

import { useEffect, useState } from 'react';
import type { Post } from '@/lib/posts';
import ContributionCalendar from '@/components/ContributionCalendar';
import TagList from '@/components/TagList';

interface Props {
  activeTag: string;
  activeDate: string;
  onTagChange: (tag: string) => void;
  onDateChange: (date: string) => void;
}

export default function Sidebar({
  activeTag,
  activeDate,
  onTagChange,
  onDateChange,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  return (
    <aside className="w-60 shrink-0 pt-8 pb-8 hidden lg:block">
      <div className="sticky top-20 space-y-6">
        <ContributionCalendar
          posts={posts}
          activeDate={activeDate}
          onDateChange={onDateChange}
        />
        <hr className="border-zinc-200 dark:border-zinc-700" />
        <TagList
          posts={posts}
          activeTag={activeTag}
          onTagChange={onTagChange}
        />
      </div>
    </aside>
  );
}
