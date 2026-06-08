import { remark } from 'remark';
import html from 'remark-html';

/** Convert Markdown string to HTML */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

/** Extract plain text preview from Markdown (first ~200 chars) */
export function markdownToPreview(markdown: string, maxLength = 200): string {
  // Remove headings markers, code blocks, images, links, and formatting
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/[*_~>|]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return plain.length > maxLength
    ? plain.slice(0, maxLength) + '...'
    : plain;
}
