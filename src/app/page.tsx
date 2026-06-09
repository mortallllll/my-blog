import { Suspense } from 'react';
import { getAllPosts } from '@/lib/posts';
import HomePageClient from './HomePageClient';

// ISR: 10 秒缓存，兼顾速度和新鲜度
export const revalidate = 10;

export default async function HomePage() {
  const allPosts = await getAllPosts(false);

  return (
    <Suspense fallback={null}>
      <HomePageClient allPosts={allPosts} />
    </Suspense>
  );
}
