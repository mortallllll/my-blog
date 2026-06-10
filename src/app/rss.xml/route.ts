import { getAllPosts } from '@/lib/posts';

const BASE_URL = 'https://my-blog-iota-red.vercel.app';
const BLOG_TITLE = "KONGYU'S BLOG";
const BLOG_DESC = '分享技术和生活的个人博客';

export async function GET() {
  const posts = await getAllPosts(false);

  const items = posts
    .map(
      (p) => `    <item>
      <title><![CDATA[${p.meta.title}]]></title>
      <link>${BASE_URL}/post/${p.slug}</link>
      <guid>${BASE_URL}/post/${p.slug}</guid>
      <pubDate>${new Date(p.meta.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <description><![CDATA[${p.meta.description}]]></description>
      ${p.meta.tags.map((t) => `<category>${t}</category>`).join('\n      ')}
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${BLOG_TITLE}</title>
    <link>${BASE_URL}</link>
    <description>${BLOG_DESC}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
