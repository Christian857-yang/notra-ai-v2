"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "你好，我是 Notra 🤖 — 你的智能 AI 助手。" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/notra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      // 流式读取响应
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiReply += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: aiReply }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([
        ...messages,
        { role: "assistant", content: "⚠️ 出现问题，请稍后再试。" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex flex-col items-center text-gray-100 p-4">
      <h1 className="text-3xl font-semibold mb-6 text-blue-400 drop-shadow-lg">
        💎 Notra Chat — GPT-4o
      </h1>

      <div className="w-full max-w-2xl flex flex-col bg-gray-800/40 border border-gray-700 rounded-2xl p-4 backdrop-blur-md shadow-xl">
        {/* 消息区 */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-gray-700 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl ${
                msg.role === "user"
                  ? "bg-blue-600/40 text-right ml-12"
                  : "bg-gray-700/40 text-left mr-12"
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => (
                    <p className="leading-relaxed break-words" {...props} />
                  ),
                  code: ({ node, inline, ...props }) =>
                    inline ? (
                      <code
                        className="bg-gray-900/70 px-1.5 py-0.5 rounded text-blue-400 text-sm"
                        {...props}
                      />
                    ) : (
                      <pre className="bg-gray-900/70 p-2 rounded text-blue-400 text-sm overflow-x-auto">
                        <code {...props} />
                      </pre>
                    ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="输入消息，按回车发送..."
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
              isLoading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30"
            }`}
          >
            {isLoading ? "思考中..." : "发送"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Powered by <span className="text-blue-400">GPT-4o</span> · Built by Notra
      </p>
    </div>
  );
}
