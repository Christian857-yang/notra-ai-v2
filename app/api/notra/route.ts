import OpenAI from "openai";

// ✅ 让 Next.js 在 Edge Runtime 执行（避免 build 阶段访问环境变量）
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing OPENAI_API_KEY. Please set it in Vercel → Settings → Environment Variables");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" }),
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const { messages } = await req.json();

    // ✅ 使用 GPT-4o，并调高 temperature 让回复更有创造力
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.9, // 💡 更具创造性、更自然
      stream: true,
    });

    // ✅ 流式返回内容
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            controller.enqueue(encoder.encode(content));
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode("\n[Error receiving stream]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("🚨 Error in /api/notra route:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
