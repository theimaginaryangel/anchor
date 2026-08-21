import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 mb-4 font-bold text-xl tracking-tight">
          Anchor
        </div>
        
        <nav className="flex flex-col gap-2 p-4 flex-grow">
          <Link href="/" className="block p-2 rounded hover:bg-gray-800 transition-colors">
            Dashboard
          </Link>
          <Link href="/upload" className="block p-2 rounded hover:bg-gray-800 transition-colors">
            Upload
          </Link>
          <Link href="/chat" className="block p-2 rounded hover:bg-gray-800 transition-colors">
            Chat
          </Link>
        </nav>

        {session?.user && (
          <div className="p-4 border-t border-gray-800 flex flex-col gap-3">
            <div className="text-sm">
              <div className="font-semibold truncate">{session.user.name}</div>
              <div className="text-gray-400 capitalize">{session.user.role || 'No Role'}</div>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <button 
                type="submit"
                className="text-sm text-left text-gray-300 hover:text-white w-full py-2"
              >
                Sign Out
              </button>
            </form>
          </div>
        )}
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
        {children}
      </div>
    </div>
  );
}
