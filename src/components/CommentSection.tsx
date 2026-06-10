'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Comment } from '@/lib/comments';

interface Props {
  slug: string;
  isAdmin?: boolean;
}

export default function CommentSection({ slug, isAdmin = false }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/${slug}`);
      if (res.ok) setComments(await res.json());
    } catch { /* 静默失败 */ }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim()) {
      setError('请填写昵称和内容');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), content: content.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '发布失败');
      }
      setContent('');
      await fetchComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条评论？')) return;
    try {
      await fetch(`/api/comments/${slug}?id=${id}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch { /* 静默失败 */ }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return '刚刚';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        评论 ({comments.length})
      </h2>

      {/* 评论列表 */}
      {loading ? (
        <p className="text-sm text-zinc-400">加载中...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">暂无评论，来说点什么吧</p>
      ) : (
        <div className="space-y-4 mb-8">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {c.nickname.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {c.nickname}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatTime(c.createdAt)}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    >
                      删除
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 发表表单 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="你的昵称"
          maxLength={30}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的想法..."
          maxLength={2000}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 resize-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? '发布中...' : '发表评论'}
        </button>
      </form>
    </div>
  );
}
