"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setMessage('Please select a valid PDF file.');
        setFile(null);
        return;
      }
      setFile(selected);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Success! ${file.name} is now being processed.`);
        setFile(null);
        // Reset the file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        router.refresh();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('An error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="border-b border-zinc-800 pb-8">
        <h1 className="text-4xl font-light tracking-tighter text-zinc-100">Upload</h1>
        <p className="text-zinc-500 mt-2 font-mono text-xs uppercase tracking-widest">
          Ingest new documents into the knowledge base
        </p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-12">
        <div className="border-2 border-dashed border-zinc-800 p-16 text-center hover:bg-zinc-900/50 transition-colors group cursor-pointer relative">
          <input 
            id="file-upload"
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="text-4xl mb-6 opacity-50 group-hover:opacity-100 transition-opacity grayscale">
            📄
          </div>
          {file ? (
            <div className="space-y-2">
              <p className="text-zinc-200 font-medium tracking-wide">{file.name}</p>
              <p className="text-zinc-600 font-mono text-xs uppercase">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-zinc-400 font-light tracking-wide">
                <span className="text-zinc-200 font-medium">Click to browse</span> or drag and drop
              </p>
              <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">
                Supported format: PDF (up to 50MB)
              </p>
            </div>
          )}
        </div>

        {message && (
          <div className={`mt-8 p-4 border font-mono text-xs tracking-wide ${
            message.includes('Success') || message.includes('Processing complete')
              ? 'bg-zinc-900 border-zinc-700 text-zinc-300' 
              : 'bg-red-950/20 border-red-900/50 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-xs font-mono tracking-widest uppercase transition-all duration-300 bg-zinc-100 text-black hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 rounded-sm"
          >
            {isUploading ? 'UPLOADING...' : 'INITIATE UPLOAD'}
          </button>
        </div>
      </div>
    </div>
  );
}
