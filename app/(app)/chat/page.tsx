"use client";

import { useState } from 'react';

import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ pageNumber: number; relevantText: string; chunkId: string }>;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.content })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          citations: data.citations
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error searching your documents.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ask a Question</h1>
        <p className="text-gray-600">Answers include citations to the source text.</p>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-y-auto p-6 mb-4 shadow-sm flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Your conversation will appear here
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300/30">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Sources:</p>
                    <div className="flex flex-col gap-2">
                      {msg.citations.map((c, i) => (
                        <details key={c.chunkId} className="text-sm rounded p-2 border border-gray-300/30">
                          <summary className="cursor-pointer font-medium opacity-90">
                            [{i + 1}] Page {c.pageNumber}
                          </summary>
                          <p className="mt-2 italic text-xs leading-relaxed border-l-2 border-gray-300/50 pl-2 opacity-75">
                            "{c.relevantText}"
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-6 py-4 text-gray-500 animate-pulse">
              Searching documents...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 rounded border border-gray-300 p-4 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-8 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 shadow-sm"
        >
          →
        </button>
      </form>
    </div>
  );
}
