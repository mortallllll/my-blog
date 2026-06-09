import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';
import ActiveFilters from '@/components/ActiveFilters';

interface HomePageProps {
  searchParams: Promise<{ search?: string; tag?: string; date?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { search, tag, date } = await searchParams;
  const posts = await getAllPosts(false);

  const filteredPosts = posts.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.meta.title.toLowerCase().includes(q) &&
        !p.meta.description.toLowerCase().includes(q)
      )
        return false;
    }
    if (tag && !p.meta.tags.includes(tag)) return false;
    if (date && p.meta.date !== date) return false;
    return true;
  });

  const hasFilters = !!(search || tag || date);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          文章列表
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          分享技术和生活的个人博客
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar />
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="mb-6">
          <ActiveFilters search={search} tag={tag} date={date} />
        </div>
      )}

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
            {hasFilters ? '没有匹配的文章' : '还没有文章'}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {hasFilters
              ? '请尝试其他筛选条件'
              : '管理员可以通过管理端发布新文章'}
          </p>
        </div>
      )}
    </div>
  );
}
