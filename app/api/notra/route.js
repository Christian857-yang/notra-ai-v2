import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const completion = await client.chat.completions.create({
      model: "gpt-4o", // ✅ 正式版 GPT-4o 模型
      messages,
      temperature: 0.9,
      stream: true,
    });

    // ✅ 流式输出（兼容 Edge Runtime）
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            controller.enqueue(encoder.encode(content));
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.enqueue(encoder.encode("\n\n⚠️ 网络中断，请重试。"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "服务器出错，请稍后再试。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
