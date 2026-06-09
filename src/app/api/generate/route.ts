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

  // 如果 description 为空，从 content 正文提取第一段
  let description = String(parsed.description || '').trim();
  if (!description) {
    const body = String(parsed.content || '');
    // 跳过所有标题行（# 开头）、空行、代码块，取第一个真正段落
    let foundHeading = false;
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      // 遇到标题行或代码块标记就记下状态，跳过
      if (/^#+\s/.test(trimmed)) { foundHeading = true; continue; }
      if (trimmed.startsWith('```')) continue;
      if (!trimmed) continue;
      // 找到正文段落：取前 120 字
      if (foundHeading || !/^#/.test(trimmed)) {
        description = trimmed.length > 120 ? trimmed.slice(0, 120) + '...' : trimmed;
        break;
      }
    }
  }

  const content = String(parsed.content || '');

  // 规范化 tags
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

  return { title, description, content, tags };
}

/* ══════════════════════════════════════════════
 * 主解析函数
 * ══════════════════════════════════════════════ */

function parseGeneratedContent(rawContent: string, topic: string) {
  // 第一步：尝试 JSON 解析
  const jsonStr = extractJsonObject(rawContent);
  if (jsonStr) {
    try {
      return normalize(JSON.parse(repairJsonNewlines(sanitizeJsonString(jsonStr))), topic);
    } catch {
      try {
        return normalize(JSON.parse(sanitizeJsonString(jsonStr)), topic);
      } catch { /* 失败，走回退 */ }
    }
  }

  // 第二步：Markdown / 原始文本回退
  const title = extractTitleFromMd(rawContent, topic);
  const description = extractDescFromMd(rawContent);
  let content = rawContent.trim();
  if (content.startsWith('{') && content.endsWith('}')) {
    const cm = content.match(/"content"\s*:\s*"([\s\S]*?)"\s*[,}]/);
    if (cm) content = cm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
  return { title, description, content, tags: [topic] };
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

要求：
- title：吸引人的标题（10-20字）
- description：简短摘要（50-100字）
- content：Markdown 格式正文，600-1000字，含标题段落列表等
- tags：3-5个标签

严格输出以下 JSON 对象（不要用代码块包裹）：

{"title":"文章标题","description":"摘要","content":"## 引言\\n\\n正文...","tags":["标签1","标签2","标签3"]}`;

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
      rawOutput: rawContent,       // 原始输出
      reasoning: reasoning || null, // 思考过程
    });
  } catch (err) {
    console.error('Generate API error:', err);
    return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 });
  }
}
