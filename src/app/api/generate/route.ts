import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

interface GenerateRequest {
  topic: string;
}

/** 清理 JSON 字符串中的常见问题 */
function sanitizeJsonString(raw: string): string {
  return (
    raw
      // 去掉首尾空白
      .trim()
      // 去掉可能的 BOM
      .replace(/^﻿/, '')
      // 修复中文引号
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
  );
}

/** 从字符串中提取最外层 {} 包裹的有效 JSON */
function extractJsonObject(text: string): string | null {
  // 先尝试整个匹配
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  // 尝试从 ```json ... ``` 代码块中提取
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    const inner = codeBlockMatch[1].trim();
    if (inner.startsWith('{') && inner.endsWith('}')) {
      return inner;
    }
  }

  // 尝试从文本中定位 { 和对应的 }
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return null;

  // 从第一个 { 往后找匹配的 }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(firstBrace, i + 1);
      }
    }
  }

  return null;
}

/** 从 markdown 文本中提取标题（# 开头的行） */
function extractTitleFromMd(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/** 从 markdown 文本中提取第一段作为描述 */
function extractDescFromMd(content: string): string {
  // 跳过标题和空行，取第一个非空段落
  const lines = content.split('\n');
  let inContent = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```')) {
      if (trimmed.startsWith('#') || trimmed === '') inContent = true;
      continue;
    }
    if (inContent) {
      // 取前 120 字
      return trimmed.length > 120 ? trimmed.slice(0, 120) + '...' : trimmed;
    }
  }
  return '';
}

/**
 * 解析 DeepSeek 返回的原始文本，尽力提取 title / description / content / tags。
 * 兼容三种输出：
 * 1. 标准 JSON                           → 直接解析
 * 2. Markdown 代码块包裹的 JSON           → 提取后解析
 * 3. 纯 Markdown 文章（模型不听指令时）    → 从 markdown 推断字段
 */
function parseGeneratedContent(rawContent: string, topic: string) {
  const jsonStr = extractJsonObject(rawContent);

  if (jsonStr) {
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
      // JSON 解析失败，回退到 markdown 提取
    }
  }

  // ---- 回退：从原始文本提取 ----
  const title = extractTitleFromMd(rawContent, `关于「${topic}」的文章`);
  const description = extractDescFromMd(rawContent);
  // 如果 text 本身看起来像纯 JSON 字符串（没被正确包裹），直接用它做内容
  const content =
    rawContent.trim().startsWith('{') ? '' : rawContent;

  return {
    title,
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
