/**
 * 给 HTML 中的 h2/h3 标签自动添加 id 属性，
 * 用于 TOC 跳转锚点。
 */
export function addHeadingIds(html: string): string {
  return html.replace(/<(h[23])\b([^>]*)>(.*?)<\/\1>/gi, (_match, tag, attrs, inner) => {
    // 如果已有 id，跳过
    if (/\bid\s*=\s*["']/i.test(attrs)) return _match;

    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text) return _match;

    const id = text
      .replace(/[^\w一-鿿]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 50);

    return `<${tag} id="${id}"${attrs}>${inner}</${tag}>`;
  });
}
