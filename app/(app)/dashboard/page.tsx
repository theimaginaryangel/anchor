"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleProcess = async () => {
    setIsProcessing(true);
    setMessage('');
    try {
      const res = await fetch('/api/documents/process', { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Processing complete');
      router.refresh();
    } catch (err) {
      setMessage('Failed to process documents');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Your documents and recent activity will appear here.
          </p>
        </div>
        <button 
          onClick={handleProcess}
          disabled={isProcessing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none"
        >
          {isProcessing ? '⚙️ Processing...' : '⚡ Process Pending Documents'}
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-medium">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Documents</h2>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-500 mt-2">uploaded</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Questions Asked</h2>
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-sm text-gray-500 mt-2">total</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <p className="text-3xl font-bold text-purple-600">Ready</p>
          <p className="text-sm text-gray-500 mt-2">system online</p>
        </div>
      </div>
      
      {/* Real data from Supabase in Phase 2+ */}
    </div>
  );
}
