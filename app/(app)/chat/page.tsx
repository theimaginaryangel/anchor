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
      <div className="mb-8 border-b border-zinc-800 pb-8">
        <h1 className="text-4xl font-light tracking-tighter text-zinc-100">Query</h1>
        <p className="text-zinc-500 mt-2 font-mono text-xs uppercase tracking-widest">Natural Language Document Search</p>
      </div>

      <div className="flex-1 overflow-y-auto mb-8 pr-4 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
            Awaiting input...
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-6 py-6 border ${
                msg.role === 'user' ? 'bg-zinc-100 text-black border-white' : 'bg-zinc-950 text-zinc-300 border-zinc-800'
              }`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-zinc' : 'prose-invert'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-zinc-800/50">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4">Referenced Sources</p>
                    <div className="flex flex-col gap-3">
                      {msg.citations.map((c, i) => (
                        <details key={c.chunkId} className="group">
                          <summary className="cursor-pointer font-mono text-xs text-zinc-400 hover:text-zinc-200 list-none flex items-center gap-2">
                            <span className="text-[10px] border border-zinc-700 px-1 py-0.5">[{i + 1}]</span> 
                            Page {c.pageNumber}
                          </summary>
                          <p className="mt-3 text-zinc-500 text-xs leading-relaxed border-l border-zinc-800 pl-4 font-serif italic">
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
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
          disabled={isLoading}
          placeholder="ENTER QUERY..."
          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 px-6 py-4 font-mono text-xs tracking-wider placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-2 bottom-2 px-6 bg-zinc-100 text-black font-mono text-xs tracking-widest uppercase hover:bg-white disabled:opacity-0 transition-opacity"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
