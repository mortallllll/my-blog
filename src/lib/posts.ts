import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { kv } from '@vercel/kv';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// KV key prefixes
const KV_SLUGS_KEY = 'posts:slugs';
const KV_POST_PREFIX = 'posts:';

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
  pinned?: boolean;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  content: string;
}

/** Validate slug to prevent path traversal */
function safeSlug(slug: string): string {
  const sanitized = slug.replace(/\.\./g, '').replace(/[\\\/]/g, '-');
  if (!sanitized || sanitized.length > 100) {
    throw new Error('Invalid slug');
  }
  return sanitized;
}

/** Check if KV storage is available (only on Vercel with proper env vars) */
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ========== File-based storage (local dev fallback) ==========

function fileGetAllPosts(includeDrafts: boolean): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    return {
      slug: file.replace(/\.md$/, ''),
      meta: {
        title: data.title || 'Untitled',
        date: data.date || new Date().toISOString().split('T')[0],
        description: data.description || '',
        tags: data.tags || [],
        draft: data.draft ?? false,
      },
      content,
    } as Post;
  });

  const filtered = includeDrafts ? posts : posts.filter((p) => !p.meta.draft);
  return filtered.sort((a, b) => {
    // 置顶优先
    if (a.meta.pinned && !b.meta.pinned) return -1;
    if (!a.meta.pinned && b.meta.pinned) return 1;
    // 然后按日期倒序
    return new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime();
  });
}

function fileGetPostBySlug(slug: string): Post | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    meta: {
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      tags: data.tags || [],
      draft: data.draft ?? false,
    },
    content,
  };
}

// ========== KV-based storage (Vercel production) ==========

async function kvGetAllPosts(includeDrafts: boolean): Promise<Post[]> {
  // Auto-seed from files if KV is empty
  const existingCount = await kv.scard(KV_SLUGS_KEY);
  if (existingCount === 0) {
    const posts = fileGetAllPosts(true);
    for (const post of posts) {
      await kv.set(`${KV_POST_PREFIX}${post.slug}`, post);
      await kv.sadd(KV_SLUGS_KEY, post.slug);
    }
  }

  const slugs: string[] = (await kv.smembers(KV_SLUGS_KEY)) || [];

  const posts: Post[] = [];
  for (const slug of slugs) {
    const post = await kvGetPostBySlug(slug);
    if (post) posts.push(post);
  }

  const filtered = includeDrafts ? posts : posts.filter((p) => !p.meta.draft);
  return filtered.sort((a, b) => {
    // 置顶优先
    if (a.meta.pinned && !b.meta.pinned) return -1;
    if (!a.meta.pinned && b.meta.pinned) return 1;
    // 然后按日期倒序
    return new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime();
  });
}

async function kvGetPostBySlug(slug: string): Promise<Post | null> {
  const data = await kv.get<Post>(`${KV_POST_PREFIX}${slug}`);
  return data || null;
}

async function kvCreatePost(slug: string, meta: PostMeta, content: string): Promise<Post> {
  const exists = await kv.exists(`${KV_POST_PREFIX}${slug}`);
  if (exists) throw new Error('文章已存在');

  const post: Post = { slug, meta, content };
  await kv.set(`${KV_POST_PREFIX}${slug}`, post);
  await kv.sadd(KV_SLUGS_KEY, slug);
  return post;
}

async function kvUpdatePost(slug: string, meta: PostMeta, content: string): Promise<Post> {
  const exists = await kv.exists(`${KV_POST_PREFIX}${slug}`);
  if (!exists) throw new Error('文章不存在');

  const post: Post = { slug, meta, content };
  await kv.set(`${KV_POST_PREFIX}${slug}`, post);
  return post;
}

async function kvDeletePost(slug: string): Promise<boolean> {
  const deleted = await kv.del(`${KV_POST_PREFIX}${slug}`);
  await kv.srem(KV_SLUGS_KEY, slug);
  return deleted > 0;
}

// ========== Public API (auto-selects storage backend) ==========

/** Read all posts, sorted by date descending */
export async function getAllPosts(includeDrafts = false): Promise<Post[]> {
  if (isKvAvailable()) {
    return kvGetAllPosts(includeDrafts);
  }
  return fileGetAllPosts(includeDrafts);
}

/** Read a single post by slug */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvGetPostBySlug(safe);
  }
  return fileGetPostBySlug(safe);
}

/** Create a new post */
export async function createPost(
  slug: string,
  meta: PostMeta,
  content: string
): Promise<Post> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvCreatePost(safe, meta, content);
  }

  // File-based fallback
  const filePath = path.join(CONTENT_DIR, `${safe}.md`);
  if (fs.existsSync(filePath)) throw new Error('文章已存在');

  const frontmatter = matter.stringify(content, {
    title: meta.title,
    date: meta.date,
    description: meta.description,
    tags: meta.tags,
    draft: meta.draft,
  });
  fs.writeFileSync(filePath, frontmatter, 'utf-8');
  return { slug: safe, meta, content };
}

/** Update an existing post */
export async function updatePost(
  slug: string,
  meta: PostMeta,
  content: string
): Promise<Post> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvUpdatePost(safe, meta, content);
  }

  // File-based fallback
  const filePath = path.join(CONTENT_DIR, `${safe}.md`);
  if (!fs.existsSync(filePath)) throw new Error('文章不存在');

  const frontmatter = matter.stringify(content, {
    title: meta.title,
    date: meta.date,
    description: meta.description,
    tags: meta.tags,
    draft: meta.draft,
  });
  fs.writeFileSync(filePath, frontmatter, 'utf-8');
  return { slug: safe, meta, content };
}

/** Delete a post */
export async function deletePost(slug: string): Promise<boolean> {
  const safe = safeSlug(slug);
  if (isKvAvailable()) {
    return kvDeletePost(safe);
  }

  // File-based fallback
  const filePath = path.join(CONTENT_DIR, `${safe}.md`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

// ========== Seed initial data to KV (call on first deploy) ==========

/** Sync content/*.md files into KV store (incremental — only adds new) */
export async function seedKvFromFiles(): Promise<number> {
  if (!isKvAvailable()) return 0;

  const posts = fileGetAllPosts(true);
  let count = 0;

  for (const post of posts) {
    const exists = await kv.exists(`${KV_POST_PREFIX}${post.slug}`);
    if (!exists) {
      await kv.set(`${KV_POST_PREFIX}${post.slug}`, post);
      await kv.sadd(KV_SLUGS_KEY, post.slug);
      count++;
    }
  }
  return count;
}
