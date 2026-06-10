import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/posts';
import { markdownToHtml } from '@/lib/markdown';
import { addHeadingIds } from '@/lib/headings';
import ReadingProgress from '@/components/ReadingProgress';
import TableOfContents from '@/components/TableOfContents';
import CommentSection from '@/components/CommentSection';
import ViewCounter from '@/components/ViewCounter';
import BackLink from '@/components/BackLink';
import { isAuthenticated } from '@/lib/auth';
import type { Metadata } from 'next';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: '文章未找到' };
  }

  return {
    title: post.meta.title,
    description: post.meta.description,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.meta.draft) {
    notFound();
  }

  const rawHtml = await markdownToHtml(post.content);
  const htmlContent = addHeadingIds(rawHtml);
  const admin = await isAuthenticated();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* Back link */}
      <BackLink />

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {post.meta.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <time dateTime={post.meta.date}>{post.meta.date}</time>
          <span>·</span>
          <ReadingProgress content={post.content} />
          <span>·</span>
          <ViewCounter slug={post.slug} track />
          {post.meta.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-2">
                {post.meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs dark:bg-zinc-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        {post.meta.description && (
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {post.meta.description}
          </p>
        )}
      </header>

      {/* Content */}
      <div
        className="prose prose-zinc max-w-none dark:prose-invert
          prose-headings:font-semibold
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:leading-7
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm
          dark:prose-code:bg-zinc-800
          prose-pre:bg-zinc-900 dark:prose-pre:bg-zinc-800
          prose-img:rounded-lg
        "
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* 目录（桌面端右侧悬浮） */}
      <TableOfContents contentHtml={htmlContent} />

      {/* 评论区 */}
      <CommentSection slug={post.slug} isAdmin={admin} />
    </article>
  );
}
