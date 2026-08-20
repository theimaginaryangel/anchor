export default function UploadPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Upload Document</h1>
      <p className="text-gray-600 mb-8">
        Upload a PDF to extract text and make it searchable. Scanned documents are processed with OCR.
      </p>

      {/* Upload logic connected in Phase 2 */}
      <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-12 flex flex-col items-center justify-center text-center mb-6">
        <span className="text-4xl mb-4">📄</span>
        <p className="text-lg font-medium text-gray-900 mb-2">Drag and drop a PDF here, or click to browse</p>
        <p className="text-sm text-gray-500">Supported format: PDF (up to 50MB)</p>
      </div>

      <div className="flex justify-end">
        <button disabled className="bg-blue-600 text-white px-6 py-2 rounded opacity-50 cursor-not-allowed font-medium">
          Upload
        </button>
      </div>
    </div>
  );
}
