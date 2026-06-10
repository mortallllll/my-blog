import Link from 'next/link';
import type { Post } from '@/lib/posts';
import ViewCounter from '@/components/ViewCounter';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { slug, meta } = post;

  return (
    <article className="group rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/post/${slug}`} className="block">
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
          {meta.pinned && (
            <span title="置顶">📌</span>
          )}
          <time dateTime={meta.date}>{meta.date}</time>
          {meta.draft && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
              草稿
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors dark:text-zinc-100 dark:group-hover:text-blue-400">
          {meta.title}
        </h2>
        <p className="mt-2 text-zinc-600 line-clamp-2 dark:text-zinc-400">
          {meta.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <ViewCounter slug={slug} className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 ml-2" />
        </div>
      </Link>
    </article>
  );
}
