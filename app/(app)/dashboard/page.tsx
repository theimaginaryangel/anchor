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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Documents</h2>
          <p className="text-3xl font-bold text-blue-600">{documents.length}</p>
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
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Uploaded Documents</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No documents uploaded yet. Go to the Upload tab to get started.
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    📄
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.filename}</h3>
                    <p className="text-sm text-gray-500">
                      Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    doc.status === 'ready' ? 'bg-green-100 text-green-800' : 
                    doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
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
