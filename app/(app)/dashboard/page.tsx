"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Document = {
  id: string;
  filename: string;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleProcess = async () => {
    setIsProcessing(true);
    setMessage('');
    try {
      const res = await fetch('/api/documents/process', { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Processing complete');
      await fetchDocuments();
      router.refresh();
    } catch (err) {
      setMessage('Failed to process documents');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tighter text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 mt-2 font-mono text-xs uppercase tracking-widest">
            System Overview
          </p>
        </div>
        <button 
          onClick={handleProcess}
          disabled={isProcessing}
          className="group relative inline-flex items-center justify-center px-6 py-3 text-xs font-mono tracking-widest uppercase transition-all duration-300 bg-zinc-100 text-black hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 rounded-sm"
        >
          {isProcessing ? 'Processing...' : 'Sync Documents'}
        </button>
      </div>

      {message && (
        <div className="p-4 border border-zinc-800 bg-zinc-900/50 text-zinc-300 font-mono text-xs tracking-wide">
          {message}
        </div>
      )}

      {/* Minimalist Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800 border border-zinc-800">
        <div className="bg-zinc-950 p-8">
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-4">Total Documents</p>
          <p className="text-5xl font-light tracking-tighter text-zinc-100">{documents.length}</p>
        </div>
        
        <div className="bg-zinc-950 p-8">
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-4">Queries Executed</p>
          <p className="text-5xl font-light tracking-tighter text-zinc-100">0</p>
        </div>
        
        <div className="bg-zinc-950 p-8">
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-4">System Status</p>
          <p className="text-5xl font-light tracking-tighter text-zinc-100">Online</p>
        </div>
      </div>
      
      {/* Minimalist List */}
      <div className="border border-zinc-800">
        <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-900/30">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Knowledge Base</h2>
        </div>
        <div className="divide-y divide-zinc-800 bg-zinc-950">
          {documents.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-sm">
              No documents currently indexed.
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="p-8 flex items-center justify-between hover:bg-zinc-900/50 transition-colors">
                <div>
                  <h3 className="font-light text-zinc-200 tracking-wide">{doc.filename}</h3>
                  <p className="font-mono text-xs text-zinc-600 mt-2 uppercase tracking-wider">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className={`px-2 py-1 border text-[10px] font-mono uppercase tracking-widest ${
                    doc.status === 'ready' ? 'border-zinc-700 text-zinc-300' : 
                    doc.status === 'processing' ? 'border-zinc-600 text-zinc-400' : 
                    'border-red-900/50 text-red-400'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
