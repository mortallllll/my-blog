import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

interface GenerateRequest {
  topic: string;
}

/** 清理 JSON 字符串常见问题 */
function sanitizeJsonString(raw: string): string {
  return (
    raw
      .trim()
      .replace(/^﻿/, '')               // BOM
      .replace(/[“”]/g, '"')           // 中文双引号
      .replace(/[‘’]/g, "'")           // 中文单引号
  );
}

/**
 * 修复 JSON 字符串内未转义的换行符。
 * DeepSeek 经常在 content 字段值中带入真实换行，
 * 导致 JSON.parse 抛错。此函数将字符串内部的 literal newline 替换为 \n。
 */
function repairJsonNewlines(jsonLike: string): string {
  const out: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < jsonLike.length; i++) {
    const ch = jsonLike[i];

    if (escape) {
      out.push(ch);
      escape = false;
      continue;
    }

    if (ch === '\\') {
      out.push(ch);
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      out.push(ch);
      continue;
    }

    // 在 JSON 字符串内部：将真实换行 / 回车转为转义形式
    if (inString && (ch === '\n' || ch === '\r')) {
      out.push('\\n');
      // 如果 \r\n 连续，跳过后一个
      if (ch === '\r' && jsonLike[i + 1] === '\n') i++;
      continue;
    }

    out.push(ch);
  }

  return out.join('');
}

/** 从文本中提取 { 到 } 的 JSON 对象 */
function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();

  // 移除 ```json ... ``` 包裹
  const codeMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const src = codeMatch ? codeMatch[1].trim() : trimmed;

  if (!src.startsWith('{')) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return src.slice(0, i + 1); }
  }
  return null;
}

/** 从 Markdown 中提取 # 标题 */
function extractTitleFromMd(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/** 从 Markdown 中提取第一段作为描述 */
function extractDescFromMd(content: string): string {
  const lines = content.split('\n');
  let started = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('```')) { started = true; continue; }
    if (started) return t.length > 120 ? t.slice(0, 120) + '...' : t;
  }
  return '';
}

/**
 * 解析 DeepSeek 返回内容，尽力提取结构化字段。
 *
 * 策略：
 * 1. 提取 JSON → 修复换行 → 解析
 * 2. 解析失败 → 从原始文本推断（标题、描述、全文件内容）
 * 3. 如果原始文本就是看起来像 JSON 的东西 → 把整段当作 content 填入编辑器
 */
function parseGeneratedContent(rawContent: string, topic: string) {
  // ---- 第一步：尝试 JSON ----
  const jsonStr = extractJsonObject(rawContent);
  if (jsonStr) {
    // 先用修复版尝试
    try {
      const repaired = repairJsonNewlines(sanitizeJsonString(jsonStr));
      const parsed = JSON.parse(repaired);
      if (parsed && typeof parsed === 'object') {
        return {
          title: String(parsed.title || ''),
          description: String(parsed.description || ''),
          content: String(parsed.content || ''),
          tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [topic],
        };
      }
    } catch {
      // 修复版失败，尝试原版
      try {
        const parsed = JSON.parse(sanitizeJsonString(jsonStr));
        if (parsed && typeof parsed === 'object') {
          return {
            title: String(parsed.title || ''),
            description: String(parsed.description || ''),
            content: String(parsed.content || ''),
            tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [topic],
          };
        }
      } catch {
        // JSON 彻底失败，继续回退
      }
    }
  }

  // ---- 第二步：回退 ----
  // 如果原始文本看起来像 JSON（以 { 开头），取掉 {} 包裹后作为内容填入
  // 永远不要返回空 content，让作者至少能看到原始输出
  const title = extractTitleFromMd(rawContent, '');
  const description = extractDescFromMd(rawContent);

  // 正文：用全文（去掉可能的 JSON 头）
  let content = rawContent.trim();
  // 如果只是纯 JSON 对象（没有 markdown），整个当正文
  if (content.startsWith('{') && content.endsWith('}')) {
    // 尝试提取 content 字段的原始值
    const cm = content.match(/"content"\s*:\s*"([\s\S]*?)"\s*[,}]/);
    if (cm) {
      content = cm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    } else {
      // 提取不到就保留全文
    }
  }

  return {
    title: title || topic,
    description,
    content,
    tags: [topic],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const topic = (body.topic || '').trim();

    if (!topic) {
      return NextResponse.json({ error: '请输入文章主题或标签' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '未配置 DEEPSEEK_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    const prompt = `你是一个中文博客作者。请根据主题「${topic}」生成一篇结构完整的 Markdown 格式博客文章。

要求：
- 标题吸引人且包含主题关键词
- 开头有一段摘要描述（50-100字）
- 正文使用 Markdown 格式：标题、段落、列表、代码块（如适用）
- 内容充实，600-1000字
- 语气轻松自然，适合个人博客
- 给出3-5个相关标签

请严格按照以下 JSON 格式输出，不要输出其他内容，不要用 markdown 代码块包裹 JSON：

{"title":"文章标题","description":"简短摘要","content":"## 正文标题\n\n正文段落...","tags":["标签1","标签2","标签3"]}

注意：
- 输出必须是纯 JSON，不要加 \`\`\` 或任何其他文字
- content 字段内使用 \\n 表示换行，不要包含实际的换行符
- tags 必须是字符串数组`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: '你是一个专业的中文博客作者，擅长撰写结构清晰、内容丰富的技术文章和生活文章。请严格按照 JSON 格式回复。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return NextResponse.json(
        { error: `DeepSeek API 返回错误 (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    const result = parseGeneratedContent(rawContent, topic);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Generate API error:', err);
    return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 });
  }
}
