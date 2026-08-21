"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav({ userName, userRole }: { userName: string | null; userRole: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upload", label: "Upload" },
    { href: "/chat", label: "Chat" },
  ];

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0a0a0a]">
        <span className="font-light text-xl tracking-tighter text-zinc-100">Anchor.</span>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 transition-colors"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="border-b border-zinc-800 bg-[#0a0a0a] px-4 py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 text-xs tracking-widest uppercase rounded-sm transition-all duration-300 ${
                pathname === link.href
                  ? "text-zinc-100 bg-zinc-900"
                  : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {userName && (
            <div className="pt-4 mt-4 border-t border-zinc-800">
              <div className="px-4 mb-3">
                <div className="font-mono text-xs text-zinc-300 truncate">{userName}</div>
                <div className="text-zinc-600 mt-1 uppercase tracking-wider text-[10px]">{userRole || "No Role"}</div>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full text-left text-xs tracking-widest uppercase px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-sm transition-all duration-300"
                >
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
