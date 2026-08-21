import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-[#0a0a0a]">
      {/* Minimalist Sidebar */}
      <div className="w-full flex-none md:w-64 bg-[#0a0a0a] border-r border-zinc-800 text-zinc-100 flex flex-col">
        <div className="p-8 font-light text-2xl tracking-tighter">
          Anchor.
        </div>
        
        <nav className="flex flex-col gap-1 px-4 flex-grow mt-8">
          <Link href="/dashboard" className="block px-4 py-3 text-xs tracking-widest uppercase text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 rounded-sm transition-all duration-300">
            Dashboard
          </Link>
          <Link href="/upload" className="block px-4 py-3 text-xs tracking-widest uppercase text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 rounded-sm transition-all duration-300">
            Upload
          </Link>
          <Link href="/chat" className="block px-4 py-3 text-xs tracking-widest uppercase text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 rounded-sm transition-all duration-300">
            Chat
          </Link>
        </nav>

        {session?.user && (
          <div className="p-8 border-t border-zinc-800 flex flex-col gap-4">
            <div className="text-xs">
              <div className="font-mono text-zinc-300 truncate">{session.user.name}</div>
              <div className="text-zinc-600 mt-1 uppercase tracking-wider text-[10px]">{session.user.role || 'No Role'}</div>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <button 
                type="submit"
                className="text-xs tracking-widest uppercase text-left text-zinc-500 hover:text-zinc-100 w-full transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        )}
      </div>
      {/* Main Content Area */}
      <div className="flex-grow md:overflow-y-auto bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}
