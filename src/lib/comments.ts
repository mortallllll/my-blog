import { kv } from '@vercel/kv';

export interface Comment {
  id: string;
  nickname: string;
  content: string;
  createdAt: string; // ISO string
}

function commentKey(slug: string): string {
  return `comments:${slug}`;
}

/** 获取文章所有评论 */
export async function getComments(slug: string): Promise<Comment[]> {
  if (!isKvAvailable()) return [];
  try {
    const data = await kv.get<Comment[]>(commentKey(slug));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** 添加评论 */
export async function addComment(
  slug: string,
  nickname: string,
  content: string
): Promise<Comment> {
  const comment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nickname: nickname.trim().slice(0, 30),
    content: content.trim().slice(0, 2000),
    createdAt: new Date().toISOString(),
  };

  if (!isKvAvailable()) return comment;

  const comments = await getComments(slug);
  comments.push(comment);
  await kv.set(commentKey(slug), comments);
  return comment;
}

/** 删除评论 */
export async function deleteComment(slug: string, id: string): Promise<boolean> {
  if (!isKvAvailable()) return false;
  const comments = await getComments(slug);
  const filtered = comments.filter((c) => c.id !== id);
  if (filtered.length === comments.length) return false;
  await kv.set(commentKey(slug), filtered);
  return true;
}

/** 检查 KV 是否可用 */
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
