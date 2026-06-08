import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';

interface HomePageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { search } = await searchParams;
  const posts = getAllPosts(false); // Only published posts

  const filteredPosts = search
    ? posts.filter(
        (p) =>
          p.meta.title.toLowerCase().includes(search.toLowerCase()) ||
          p.meta.description.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          文章列表
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          分享技术和生活的个人博客
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <SearchBar />
      </div>

      {/* Post Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            {search ? '没有找到匹配的文章' : '还没有文章'}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {search ? '请尝试其他关键词' : '管理员可以通过管理端发布新文章'}
          </p>
        </div>
      )}
    </div>
  );
}
