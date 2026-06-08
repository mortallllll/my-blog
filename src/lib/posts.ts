import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
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

/** Read all posts from the content directory, sorted by date descending */
export function getAllPosts(includeDrafts = false): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

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

  const filtered = includeDrafts
    ? posts
    : posts.filter((p) => !p.meta.draft);

  return filtered.sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );
}

/** Read a single post by slug */
export function getPostBySlug(slug: string): Post | null {
  const safe = safeSlug(slug);
  const filePath = path.join(CONTENT_DIR, `${safe}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug: safe,
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

/** Create a new post */
export function createPost(slug: string, meta: PostMeta, content: string): Post {
  const safe = safeSlug(slug);
  const filePath = path.join(CONTENT_DIR, `${safe}.md`);

  if (fs.existsSync(filePath)) {
    throw new Error('文章已存在');
  }

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
export function updatePost(slug: string, meta: PostMeta, content: string): Post {
  const safe = safeSlug(slug);
  const filePath = path.join(CONTENT_DIR, `${safe}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error('文章不存在');
  }

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
export function deletePost(slug: string): boolean {
  const safe = safeSlug(slug);
  const filePath = path.join(CONTENT_DIR, `${safe}.md`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}
