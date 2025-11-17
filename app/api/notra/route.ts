import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// ✅ 读取环境变量
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge'; // 🚀 更快响应

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('缺少 OPENAI_API_KEY 环境变量');
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('请求格式错误，缺少 messages 数组');
    }

    // ✅ 使用 GPT-4o 模型
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.9,
      stream: true,
    });

    // ✅ 流式输出
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (err: any) {
    console.error('❌ API Error:', err);
    return NextResponse.json(
      { error: err.message || '服务器错误，请稍后重试。' },
      { status: 500 }
    );
  }
}
