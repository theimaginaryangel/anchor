export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ask a Question</h1>
        <p className="text-gray-600">
          Ask anything about your uploaded documents. Answers include citations to the source text.
        </p>
      </div>

      {/* Chat logic connected in Phase 5 */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg mb-4 flex items-center justify-center p-4 overflow-y-auto">
        <p className="text-gray-400">Your conversation will appear here</p>
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="Ask a question about your documents..." 
          className="flex-1 border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled
        />
        <button disabled className="bg-blue-600 text-white px-6 py-3 rounded-md opacity-50 cursor-not-allowed">
          →
        </button>
      </div>
    </div>
  );
}
