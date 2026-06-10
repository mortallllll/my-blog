import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

interface GenerateRequest {
  topic: string;
}

/* ══════════════════════════════════════════════
 * JSON 清洗 / 修复 / 提取
 * ══════════════════════════════════════════════ */

function sanitizeJsonString(raw: string): string {
  return raw
    .trim()
    .replace(/^﻿/, '')           // BOM
    .replace(/[“”]/g, '"')   // 中文双引号
    .replace(/[‘’]/g, "'");  // 中文单引号
}

/** 修复 JSON 字符串内部的真实换行 → \\n */
function repairJsonNewlines(jsonLike: string): string {
  const out: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < jsonLike.length; i++) {
    const ch = jsonLike[i];
    if (escape) { out.push(ch); escape = false; continue; }
    if (ch === '\\') { out.push(ch); escape = true; continue; }
    if (ch === '"') { inString = !inString; out.push(ch); continue; }
    if (inString && (ch === '\n' || ch === '\r')) {
      out.push('\\n');
      if (ch === '\r' && jsonLike[i + 1] === '\n') i++;
      continue;
    }
    out.push(ch);
  }
  return out.join('');
}

/** 从文本提取最外层 { … } */
function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  const codeMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const src = codeMatch ? codeMatch[1].trim() : trimmed;
  if (!src.startsWith('{')) return null;

  let depth = 0, inString = false, esc = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return src.slice(0, i + 1); }
  }
  return null;
}

/* ══════════════════════════════════════════════
 * Markdown 回退提取
 * ══════════════════════════════════════════════ */

function extractTitleFromMd(content: string, fallback: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

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

/* ══════════════════════════════════════════════
 * 响应规范化
 * ══════════════════════════════════════════════ */

function normalize(parsed: Record<string, unknown>, topic: string) {
  const title = String(parsed.title || '').trim();
  const content = String(parsed.content || '');

  // slug：AI 生成或从标题提取英文
  let slug = String(parsed.slug || '').trim();
  if (!slug && title) {
    // 回退：从标题提取英文单词，无英文则用拼音占位 + 时间戳
    const enMatch = title.match(/[a-zA-Z0-9]+/g);
    if (enMatch) {
      slug = enMatch.join('-').toLowerCase().slice(0, 60);
    } else {
      slug = `post-${Date.now().toString(36)}`;
    }
  }

  // description：优先 AI 生成，空则从正文首段提取
  let description = String(parsed.description || '').trim();
  if (!description) {
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (/^#+\s/.test(t)) continue;  // 跳过标题
      if (t.startsWith('```')) continue;
      if (!t) continue;
      description = t.length > 120 ? t.slice(0, 120) + '...' : t;
      break;
    }
  }

  // tags：支持数组或逗号/顿号分隔的字符串
  let tags: string[];
  const rawTags = parsed.tags;
  if (Array.isArray(rawTags)) {
    tags = rawTags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === 'string') {
    tags = rawTags.split(/[,，、]/).map((t) => t.trim()).filter(Boolean);
  } else {
    tags = [];
  }
  if (tags.length === 0) tags = [topic];

  return { title, slug, description, content, tags };
}

/* ══════════════════════════════════════════════
 * 主解析函数
 * ══════════════════════════════════════════════ */

function generateSlug(title: string): string {
  if (!title) return `post-${Date.now().toString(36)}`;
  const enMatch = title.match(/[a-zA-Z0-9]+/g);
  if (enMatch) return enMatch.join('-').toLowerCase().slice(0, 60);
  return `post-${Date.now().toString(36)}`;
}

function parseGeneratedContent(rawContent: string, topic: string) {
  // 第一步：尝试 JSON 解析
  const jsonStr = extractJsonObject(rawContent);
  if (jsonStr) {
    // 试 repair → 试 sanitize → 试原版
    const attempts = [
      () => JSON.parse(repairJsonNewlines(sanitizeJsonString(jsonStr))),
      () => JSON.parse(sanitizeJsonString(jsonStr)),
      () => JSON.parse(jsonStr),
    ];
    for (const fn of attempts) {
      try {
        const parsed = fn();
        if (parsed && typeof parsed === 'object') {
          return normalize(parsed, topic);
        }
      } catch { /* 继续下一个 */ }
    }
  }

  // 第二步：回退（没有 JSON 或全部解析失败）
  const title = extractTitleFromMd(rawContent, topic);
  const description = extractDescFromMd(rawContent);
  let content = rawContent.trim();
  if (content.startsWith('{') && content.endsWith('}')) {
    const cm = content.match(/"content"\s*:\s*"([\s\S]*?)"\s*[,}]/);
    if (cm) content = cm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
  const slug = generateSlug(title);
  return { title, slug, description, content, tags: [topic] };
}

/* ══════════════════════════════════════════════
 * API 路由
 * ══════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const topic = (body.topic || '').trim();
    if (!topic) {
      return NextResponse.json({ error: '请输入文章主题或标签' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 DEEPSEEK_API_KEY 环境变量' }, { status: 500 });
    }

    const prompt = `你是一个中文博客作者。请根据主题「${topic}」生成一篇结构完整的博客文章。

严格输出一个 JSON 对象（不要用 markdown 代码块包裹），字段要求：

- title：中文标题，10-20字，吸引人
- slug：英文 URL 标识，由关键词+连字符组成，如 yangming-philosophy-today
- description：中文摘要，50-100字
- content：Markdown 正文，3000-10000字，用 \\n 表示换行
- tags：短小精悍的中文标签，逗号分隔，如 哲学,传统文化,心学

示例：
{"title":"阳明心学的现代启示","slug":"yangming-philosophy-today","description":"在快节奏的现代社会...","content":"## 引言\\n\\n阳明心学作为...","tags":"哲学,传统文化,心学"}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: '你是专业中文博客作者。只输出 JSON，不要其他文字。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return NextResponse.json({ error: `DeepSeek API 返回错误 (${response.status})` }, { status: 502 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    // DeepSeek 可能返回 reasoning_content（思考过程）
    const reasoning = data.choices?.[0]?.message?.reasoning_content || '';

    const result = parseGeneratedContent(rawContent, topic);

    return NextResponse.json({
      ...result,
      rawOutput: rawContent,
      reasoning: reasoning || null,
      // 诊断：API 返回的字段列表，方便确认解析结果
      _filled: {
        title: !!result.title,
        slug: !!result.slug,
        description: !!result.description,
        content: !!result.content,
        tags: result.tags?.length || 0,
      },
    });
  } catch (err) {
    console.error('Generate API error:', err);
    return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 });
  }
}
