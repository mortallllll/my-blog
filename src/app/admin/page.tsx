'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import PostEditor from '@/components/PostEditor';
import { useToast } from '@/components/Toast';
import type { Post, PostMeta } from '@/lib/posts';

type ViewMode = 'list' | 'create' | 'edit';

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreate = async (data: {
    slug: string;
    meta: PostMeta;
    content: string;
  }) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '创建失败');
    }

    toast('文章已发布');
    setViewMode('list');
    fetchPosts();
    router.refresh();
  };

  const handleUpdate = async (data: {
    slug: string;
    meta: PostMeta;
    content: string;
  }) => {
    const res = await fetch(`/api/posts/${editingPost!.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: data.meta, content: data.content }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '更新失败');
    }

    toast('文章已更新');
    setViewMode('list');
    setEditingPost(null);
    fetchPosts();
    router.refresh();
  };

  const handleDelete = async () => {
    if (!editingPost) return;

    const res = await fetch(`/api/posts/${editingPost.slug}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '删除失败');
    }

    toast('文章已删除');
    setViewMode('list');
    setEditingPost(null);
    fetchPosts();
    router.refresh();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  // --- Render: Create Mode ---
  if (viewMode === 'create') {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            新建文章
          </h1>
          <button
            onClick={() => setViewMode('list')}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 transition dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300"
          >
            返回列表
          </button>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <PostEditor onSave={handleCreate} />
        </div>
      </div>
    );
  }

  // --- Render: Edit Mode ---
  if (viewMode === 'edit' && editingPost) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            编辑文章
          </h1>
          <button
            onClick={() => {
              setViewMode('list');
              setEditingPost(null);
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 transition dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300"
          >
            返回列表
          </button>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <PostEditor
            post={editingPost}
            onSave={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
      </div>
    );
  }

  // --- Render: List Mode ---
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            文章管理
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            共 {posts.length} 篇文章（含草稿）
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('create')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            + 新建文章
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            登出
          </button>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            查看网站 →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-zinc-500 dark:text-zinc-400">
            还没有文章，点击上方按钮创建第一篇
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                  标题
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  日期
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                  状态
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.slug}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {post.meta.title}
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      /{post.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {post.meta.date}
                  </td>
                  <td className="px-4 py-3">
                    {post.meta.draft ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                        草稿
                      </span>
                    ) : (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                        已发布
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingPost(post);
                          setViewMode('edit');
                        }}
                        className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        编辑
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`确定删除「${post.meta.title}」？`)) return;
                          await fetch(`/api/posts/${post.slug}`, { method: 'DELETE' });
                          fetchPosts();
                          router.refresh();
                        }}
                        className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
