import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

interface GenerateRequest {
  topic: string;
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

请严格按照以下 JSON 格式输出，不要输出其他内容：
{
  "title": "文章标题",
  "description": "简短摘要",
  "content": "Markdown 正文内容",
  "tags": ["标签1", "标签2", "标签3"]
}`;

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

    // 尝试解析 JSON 回复
    let parsed: { title?: string; description?: string; content?: string; tags?: string[] };
    try {
      // 提取 JSON（可能被 markdown 代码块包裹）
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      const jsonStr = jsonMatch[1] || rawContent;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      // 解析失败时用原始内容作为正文
      parsed = {
        title: `关于「${topic}」的文章`,
        description: '',
        content: rawContent,
        tags: [topic],
      };
    }

    return NextResponse.json({
      title: parsed.title || '',
      description: parsed.description || '',
      content: parsed.content || '',
      tags: parsed.tags || [topic],
    });
  } catch (err) {
    console.error('Generate API error:', err);
    return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 });
  }
}
