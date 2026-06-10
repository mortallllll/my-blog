'use client';

import { useState } from 'react';
import type { Post } from '@/lib/posts';
import { useToast } from '@/components/Toast';

interface PostEditorProps {
  post?: Post;
  onSave: (data: {
    slug: string;
    meta: {
      title: string;
      date: string;
      description: string;
      tags: string[];
      draft: boolean;
      pinned?: boolean;
    };
    content: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function PostEditor({ post, onSave, onDelete }: PostEditorProps) {
  const isEdit = !!post;

  const [slug, setSlug] = useState(post?.slug || '');
  const [title, setTitle] = useState(post?.meta.title || '');
  const [date, setDate] = useState(post?.meta.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(post?.meta.description || '');
  const [tagsInput, setTagsInput] = useState(post?.meta.tags.join(', ') || '');
  const [draft, setDraft] = useState(post?.meta.draft ?? false);
  const [pinned, setPinned] = useState(post?.meta.pinned ?? false);
  const [content, setContent] = useState(post?.content || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---- AI 生成状态 ----
  const [aiTopic, setAiTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    reasoning?: string;
    rawOutput?: string;
    title?: string;
    description?: string;
    content?: string;
    tags?: string[];
    _filled?: { title: boolean; slug: boolean; description: boolean; content: boolean; tags: number };
  } | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleGenerate = async () => {
    const topic = aiTopic.trim();
    if (!topic) {
      setError('请输入生成主题或标签');
      return;
    }

    setError('');
    setGenerating(true);
    setAiResult(null);
    setShowReasoning(false);
    setShowRaw(false);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '生成失败');
      }

      // 保存诊断信息
      setAiResult({
        reasoning: data.reasoning,
        rawOutput: data.rawOutput,
        title: data.title,
        description: data.description,
        content: data.content,
        tags: data.tags,
        // 诊断字段
        _filled: data._filled,
      });

      // 自动填入编辑器
      setTitle(data.title || '');
      setDescription(data.description || '');
      setContent(data.content || '');

      const tagsArr = Array.isArray(data.tags) ? data.tags : [];
      setTagsInput(tagsArr.join(', '));

      // slug：优先用 AI 生成的英文标识
      if (!isEdit) {
        if (data.slug) {
          setSlug(data.slug);
        } else {
          let s = data.title
            ?.replace(/[^\w一-鿿\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 60) || '';
          if (!s) s = `post-${Date.now().toString(36)}`;
          setSlug(s);
        }
      }

      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '生成失败';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }
    if (!isEdit && !slug.trim()) {
      setError('URL 标识不能为空');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        slug: slug.trim() || post!.slug,
        meta: {
          title: title.trim(),
          date,
          description: description.trim(),
          tags: tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          draft,
          pinned,
        },
        content,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '保存失败';
      setError(message);
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const { toast } = useToast();

  const handleDelete = async () => {
    if (!isEdit || !post) return;
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '删除失败');
      }
      toast('文章已删除');
      // toast 后再调 onDelete（admin 切换视图）
      if (onDelete) await onDelete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除失败';
      setError(message);
      setDeleting(false);
      toast(message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* === AI 生成区域 === */}
      <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            AI 快速生成
          </span>
          <span className="text-xs text-purple-400 dark:text-purple-500">DeepSeek</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGenerate())}
            placeholder="输入主题，如：Python 入门教程"
            className="flex-1 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-purple-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-purple-400 dark:focus:ring-purple-800"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !aiTopic.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition sm:shrink-0"
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                思考中...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                生成文章
              </>
            )}
          </button>
        </div>

        {/* 生成结果摘要 */}
        {aiResult && !generating && (
          <div className="mt-3 space-y-2">
            {/* 思考过程（如果有） */}
            {aiResult.reasoning && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  <svg className={`h-3 w-3 transition ${showReasoning ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  思考过程 ({aiResult.reasoning.length} 字)
                </button>
                {showReasoning && (
                  <pre className="mt-1 rounded bg-purple-100/50 p-2 text-xs text-purple-900 whitespace-pre-wrap max-h-40 overflow-y-auto dark:bg-purple-900/30 dark:text-purple-200">
                    {aiResult.reasoning}
                  </pre>
                )}
              </div>
            )}

            {/* 原始输出 */}
            {aiResult.rawOutput && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowRaw(!showRaw)}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  <svg className={`h-3 w-3 transition ${showRaw ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  原始输出
                </button>
                {showRaw && (
                  <pre className="mt-1 rounded bg-purple-100/50 p-2 text-xs text-purple-900 whitespace-pre-wrap max-h-40 overflow-y-auto dark:bg-purple-900/30 dark:text-purple-200">
                    {aiResult.rawOutput}
                  </pre>
                )}
              </div>
            )}

            {/* 解析结果确认 */}
            <p className="text-xs text-purple-500 dark:text-purple-400">
              {aiResult._filled ? (
                <>
                  API 解析：{aiResult._filled.title ? '✅标题 ' : '❌标题 '}
                  {aiResult._filled.slug ? '✅slug ' : '❌slug '}
                  {aiResult._filled.description ? '✅摘要 ' : '❌摘要 '}
                  {aiResult._filled.content ? '✅正文 ' : '❌正文 '}
                  {aiResult._filled.tags > 0 ? `✅标签(${aiResult._filled.tags}) ` : '❌标签 '}
                </>
              ) : (
                <>
                  ✅ 已填入：{aiResult.title && '标题 '}
                  {aiResult.description && '摘要 '}
                  {aiResult.content && '正文 '}
                  {aiResult.tags?.length ? `标签(${aiResult.tags.length}) ` : ''}
                </>
              )}
              — 可在下方微调后发布
            </p>
          </div>
        )}

        {!aiResult && !generating && (
          <p className="mt-2 text-xs text-purple-400 dark:text-purple-500">
            输入主题后点击生成，AI 会自动填写标题、摘要、正文和标签
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            标题 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            placeholder="文章标题"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            URL 标识 {!isEdit && '*'}
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={isEdit}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            placeholder="my-article-slug"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            标签 (逗号分隔)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            placeholder="技术, 生活, 教程"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          摘要描述
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          placeholder="简短描述这篇文章..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="draft"
          checked={draft}
          onChange={(e) => setDraft(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
        />
        <label htmlFor="draft" className="text-sm text-zinc-700 dark:text-zinc-300">
          标记为草稿（仅管理员可见）
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pinned"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
        />
        <label htmlFor="pinned" className="text-sm text-zinc-700 dark:text-zinc-300">
          📌 置顶文章（始终显示在首页最前面）
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            内容 (Markdown) *
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {showPreview ? '编辑' : '预览'}
          </button>
        </div>
        {showPreview ? (
          <div className="prose prose-zinc max-w-none rounded-lg border border-zinc-300 bg-white p-4 min-h-[300px] dark:prose-invert dark:border-zinc-700 dark:bg-zinc-800">
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300">
              {content || '(空内容)'}
            </pre>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            placeholder="## 开始写作...&#10;&#10;支持 Markdown 格式。"
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <div>
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
            >
              {deleting ? '删除中...' : '删除文章'}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? '保存中...' : isEdit ? '更新文章' : '发布文章'}
        </button>
      </div>
    </form>
  );
}
