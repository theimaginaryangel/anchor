import Link from "next/link";
import { auth, signOut } from "@/auth";
import MobileNav from "@/components/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-[#0a0a0a]">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:flex w-64 flex-none bg-[#0a0a0a] border-r border-zinc-800 text-zinc-100 flex-col">
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
          <div className="px-4 py-8 border-t border-zinc-800 flex flex-col gap-2">
            <div className="text-xs px-4 mb-2">
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
                className="text-xs tracking-widest uppercase text-left px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-sm w-full transition-all duration-300"
              >
                Sign Out
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Header — visible only on mobile */}
      <MobileNav userName={session?.user?.name || null} userRole={session?.user?.role || null} />

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white custom-scrollbar">
        <div className="max-w-6xl mx-auto p-4 pt-4 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}
