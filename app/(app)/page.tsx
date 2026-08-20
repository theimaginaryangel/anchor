export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Your documents and recent activity will appear here.</p>
      
      {/* Real data from Supabase in Phase 2+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Documents</h2>
          <p className="text-3xl font-bold">0 uploaded</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Questions Asked</h2>
          <p className="text-3xl font-bold">0 total</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Status</h2>
          <p className="text-3xl font-bold text-green-600">Ready</p>
        </div>
      </div>
    </div>
  );
}
