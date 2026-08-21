"use client";

import { useState, useRef, useEffect } from 'react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-8 border-b border-zinc-800 pb-8">
        <h1 className="text-4xl font-light tracking-tighter text-zinc-100">Query</h1>
        <p className="text-zinc-500 mt-2 font-mono text-xs uppercase tracking-widest">Natural Language Document Search</p>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 pr-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-2xl shadow-sm border border-zinc-800/50">
                ⚓
              </div>
              <p className="font-medium text-sm text-zinc-400">How can I help you today?</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mt-4">
              <button onClick={() => handleSend("What are Benny's cloud engineering skills?")} className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-left">
                &quot;What are Benny&apos;s cloud engineering skills?&quot;
              </button>
              <button onClick={() => handleSend("Summarize Benny's experience with AWS.")} className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-left">
                &quot;Summarize Benny&apos;s experience with AWS.&quot;
              </button>
              <button onClick={() => handleSend("What certifications does Benny hold?")} className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-left">
                &quot;What certifications does Benny hold?&quot;
              </button>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-5 py-3.5 ${
                msg.role === 'user' 
                  ? 'bg-zinc-100 text-black rounded-3xl rounded-br-sm' 
                  : 'bg-zinc-900 text-zinc-100 rounded-3xl rounded-bl-sm'
              }`}>
                
                <div className={`prose prose-sm max-w-none ${
                  msg.role === 'user' 
                    ? 'prose-zinc prose-a:text-black hover:prose-a:bg-zinc-200 prose-a:px-1 prose-a:rounded prose-a:transition-colors' 
                    : 'prose-invert prose-a:text-white hover:prose-a:bg-zinc-800 prose-a:px-1 prose-a:rounded prose-a:transition-colors'
                }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-700/50">
                    <div className="flex flex-col gap-2">
                      {msg.citations.map((c, i) => (
                        <details key={c.chunkId} className="group">
                          <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200 list-none flex items-center gap-2 select-none">
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">Source {i + 1}</span> 
                            Page {c.pageNumber}
                          </summary>
                          <p className="mt-2 text-zinc-400 text-xs leading-relaxed pl-2 border-l-2 border-zinc-700 italic">
                            &quot;{c.relevantText}&quot;
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
        <div ref={messagesEndRef} />
      </div>

      <div className="relative group max-w-4xl mx-auto w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
          disabled={isLoading}
          placeholder="Ask anything..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full text-zinc-100 pl-6 pr-16 py-4 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:bg-zinc-800 transition-all shadow-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-2 bottom-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
