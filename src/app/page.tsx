import { Suspense } from 'react';
import { getAllPosts } from '@/lib/posts';
import HomePageClient from './HomePageClient';

// 每次请求都从 KV 获取最新数据，确保日历实时
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allPosts = await getAllPosts(false);

  return (
    <Suspense fallback={null}>
      <HomePageClient allPosts={allPosts} />
    </Suspense>
  );
}
