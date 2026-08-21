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
              <div className={`max-w-[85%] px-6 py-6 shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-zinc-100 text-zinc-900 rounded-2xl rounded-tr-sm' 
                  : 'bg-zinc-900 text-zinc-100 border border-zinc-700/50 rounded-2xl rounded-tl-sm'
              }`}>
                {/* Role Label */}
                <div className={`text-[10px] font-mono uppercase tracking-widest mb-3 ${msg.role === 'user' ? 'text-zinc-500 text-right' : 'text-zinc-500'}`}>
                  {msg.role === 'user' ? 'You' : 'Anchor AI'}
                </div>

                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-zinc' : 'prose-invert'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-zinc-700/50">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">Referenced Sources</p>
                    <div className="flex flex-col gap-2">
                      {msg.citations.map((c, i) => (
                        <details key={c.chunkId} className="group bg-zinc-950/50 border border-zinc-800 rounded-md p-3">
                          <summary className="cursor-pointer font-mono text-xs text-zinc-300 hover:text-white list-none flex items-center gap-2">
                            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">[{i + 1}]</span> 
                            Page {c.pageNumber}
                          </summary>
                          <p className="mt-3 text-zinc-400 text-xs leading-relaxed border-l-2 border-zinc-700 pl-3 font-serif italic">
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

      <div className="relative group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
          disabled={isLoading}
          placeholder="Type your query here..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 px-6 py-5 font-mono text-sm tracking-wide placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent disabled:opacity-50 shadow-lg transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="absolute right-3 top-3 bottom-3 px-6 rounded-lg bg-zinc-100 text-zinc-900 font-bold text-xs uppercase tracking-wider hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          {isLoading ? 'Searching...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
