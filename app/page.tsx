'use client';

import { useState, useEffect, useRef } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function NotraAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好，我是 Notra AI 🤖，基于 GPT-4o，为你提供最优解答。' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`请求错误 (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';
      let isFirstChunk = true;

      // ✅ 实时流式输出
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantReply += chunk;

        // ✅ 防止重复渲染（提升性能）
        if (isFirstChunk) {
          setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
          isFirstChunk = false;
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantReply;
          return updated;
        });
      }
    } catch (err: any) {
      console.error('❌ Chat error:', err);
      setError('请求失败，请检查网络或 API Key。');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 支持回车发送
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex flex-col items-center justify-between min-h-screen bg-black text-white px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-green-400">
        🤖 Notra AI Chat (GPT-4o)
      </h1>

      <div className="flex flex-col w-full max-w-3xl flex-1 border border-neutral-800 rounded-lg overflow-y-auto p-4 bg-neutral-950 shadow-lg">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`my-2 p-3 rounded-lg max-w-[80%] ${
              m.role === 'user'
                ? 'bg-blue-600 text-white self-end ml-auto'
                : 'bg-neutral-800 text-green-300 self-start mr-auto'
            }`}
          >
            {m.content || (m.role === 'assistant' ? '...' : '')}
          </div>
        ))}
        {isLoading && (
          <div className="text-neutral-500 text-sm italic mt-2">Notra AI 正在思考中...</div>
        )}
        <div ref={chatEndRef} />
      </div>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      <div className="w-full max-w-3xl flex items-center mt-4">
        <input
          className="flex-1 p-3 rounded-l-md bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-blue-500"
          placeholder="输入你的问题..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className={`px-5 py-3 rounded-r-md transition-all ${
            isLoading
              ? 'bg-neutral-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>

      <p className="text-neutral-500 text-xs mt-3">
        ⚙️ Powered by OpenAI GPT-4o • Notra AI © 2025
      </p>
    </main>
  );
}
