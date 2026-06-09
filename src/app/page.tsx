import { Suspense } from 'react';
import { getAllPosts } from '@/lib/posts';
import HomePageClient from './HomePageClient';

// 强制动态渲染：每次请求都从 KV 拉取最新文章
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allPosts = await getAllPosts(false);

  return (
    <Suspense fallback={null}>
      <HomePageClient allPosts={allPosts} />
    </Suspense>
  );
}
