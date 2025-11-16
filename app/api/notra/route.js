import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.9,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices?.[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (err) {
    console.error("API Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
