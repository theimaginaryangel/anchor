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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Upload Document</h1>
      <p className="text-gray-600 mb-8">
        Upload a PDF to extract text and make it searchable. Scanned documents are processed with OCR.
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
        <div className="text-4xl mb-4">📄</div>
        <div className="mb-4">
          <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800 font-semibold">
            Click to browse
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          <span className="text-gray-500"> or drag and drop a PDF here</span>
        </div>
        <p className="text-sm text-gray-500">Supported format: PDF (up to 50MB)</p>
      </div>

      {file && (
        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded flex justify-between items-center border border-blue-200">
          <span className="font-medium truncate mr-4">{file.name}</span>
          <span className="text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-4 rounded ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`px-6 py-2 rounded font-semibold text-white transition-colors ${
            !file || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
}
