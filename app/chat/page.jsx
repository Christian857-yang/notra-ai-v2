"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "你好，我是 Notra 🤖。有什么可以帮你？" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息函数
  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/notra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      // 流式接收
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiReply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiReply += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: aiReply }]);
      }
    } catch (error) {
      console.error(error);
      alert("❌ 出错了，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">💬 Notra AI Chat</h1>

      <div className="w-full max-w-2xl bg-gray-800/40 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600/40 self-end text-right"
                  : "bg-gray-700/50 text-left"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center mt-4 gap-2">
          <input
            className="flex-1 p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-blue-500"
            placeholder="输入你的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className={`px-4 py-3 rounded-lg font-medium transition ${
              isLoading
                ? "bg-gray-700 text-gray-400"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {isLoading ? "思考中..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
