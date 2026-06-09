import { Suspense } from 'react';
import { getAllPosts } from '@/lib/posts';
import HomePageClient from './HomePageClient';

export default async function HomePage() {
  const allPosts = await getAllPosts(false);

  return (
    <Suspense fallback={null}>
      <HomePageClient allPosts={allPosts} />
    </Suspense>
  );
}
