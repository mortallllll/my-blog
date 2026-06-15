'use client';

import { useState } from 'react';
import type { Book, BookMeta } from '@/lib/books';
import { useToast } from '@/components/Toast';

interface BookEditorProps {
  book?: Book;
  onSave: (data: { slug: string; meta: BookMeta }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const ALL_STATUSES: BookMeta['status'][] = ['want', 'reading', 'done'];

const STATUS_LABELS: Record<string, string> = {
  want: '想读',
  reading: '在读',
  done: '已读',
};

export default function BookEditor({ book, onSave, onDelete }: BookEditorProps) {
  const isEdit = !!book;

  // Form state
  const [slug, setSlug] = useState(book?.slug || '');
  const [author, setAuthor] = useState(book?.meta.author || '');
  const [cover, setCover] = useState(book?.meta.cover || '');
  const [rating, setRating] = useState<number>(book?.meta.rating || 3);
  const [status, setStatus] = useState<BookMeta['status']>(book?.meta.status || 'want');
  const [review, setReview] = useState(book?.meta.review || '');
  const [tagsInput, setTagsInput] = useState(book?.meta.tags.join(', ') || '');
  const [recommend, setRecommend] = useState(book?.meta.recommend ?? false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [coverError, setCoverError] = useState(false);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!titleValid()) {
      setError('书名（slug）不能为空');
      return;
    }
    if (!author.trim()) {
      setError('作者不能为空');
      return;
    }

    setSaving(true);
    try {
      const meta: BookMeta = {
        author: author.trim(),
        cover: cover.trim(),
        rating,
        status,
        review: review.trim(),
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        recommend,
      };
      await onSave({ slug: slug.trim(), meta });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // Hidden title check — display label for slug
  const titleValid = () => slug.trim().length > 0;

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这本书吗？此操作不可撤销。')) return;

    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/books/${book!.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '删除失败');
      }
      toast('书籍已删除');
      await onDelete?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '删除失败');
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic fields grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            书名 (slug) *
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={isEdit}
            placeholder="the-clean-coder"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-400 dark:focus:ring-blue-800 disabled:opacity-50"
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            作者 *
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Robert C. Martin"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
          />
        </div>
      </div>

      {/* Cover */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          封面图片 URL
        </label>
        <div className="flex items-start gap-3">
          <input
            type="text"
            value={cover}
            onChange={(e) => { setCover(e.target.value); setCoverError(false); }}
            placeholder="https://example.com/cover.jpg"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
          />
          {cover && !coverError && (
            <img
              src={cover}
              alt="封面预览"
              className="h-20 w-14 rounded border border-zinc-200 object-cover dark:border-zinc-600"
              onError={() => setCoverError(true)}
            />
          )}
        </div>
      </div>

      {/* Rating + Status in one row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Star rating picker */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            评分
          </label>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="评分">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} 星`}
                className={`text-2xl transition ${
                  n <= rating
                    ? 'text-amber-400'
                    : 'text-zinc-300 dark:text-zinc-600'
                } hover:scale-110`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            阅读状态
          </label>
          <div className="flex gap-1.5">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  status === s
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          短评
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
          placeholder="对这本书的简短评价…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          标签（逗号分隔）
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="编程, 软件工程, 经典"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
        />
      </div>

      {/* Recommend */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recommend"
          checked={recommend}
          onChange={(e) => setRecommend(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
        />
        <label htmlFor="recommend" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          ⭐ 精选推荐（显示在列表最前面）
        </label>
      </div>

      {/* Bottom action bar */}
      <hr className="border-zinc-200 dark:border-zinc-700" />
      <div className="flex items-center justify-between">
        {isEdit && onDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {deleting ? '删除中…' : '删除书籍'}
          </button>
        ) : (
          <div />
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {saving ? '保存中…' : isEdit ? '更新书籍' : '发布书籍'}
        </button>
      </div>
    </form>
  );
}
