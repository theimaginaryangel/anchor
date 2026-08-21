import Link from 'next/link';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-zinc-100 p-8 selection:bg-zinc-800 selection:text-white">
      <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-12">
        
        {/* Minimalist Logo / Title */}
        <div className="space-y-4 tracking-tighter">
          <h1 className="text-5xl md:text-7xl font-light">
            Anchor
          </h1>
          <div className="w-12 h-[1px] bg-zinc-700 mx-auto rounded-full"></div>
        </div>

        {/* Value Prop */}
        <p className="text-zinc-400 text-lg md:text-xl font-light tracking-wide max-w-xl leading-relaxed">
          Enterprise document intelligence. Extract, vectorize, and semantically query your scanned archives with exact citations.
        </p>

        {/* CTA */}
        <div className="pt-8">
          {session ? (
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium tracking-widest uppercase transition-all duration-300 bg-white text-black hover:bg-zinc-200 rounded-sm"
            >
              Enter Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium tracking-widest uppercase transition-all duration-300 border border-zinc-700 hover:bg-white hover:text-black rounded-sm"
            >
              Sign In
            </Link>
          )}
        </div>
        
        {/* Footer Credit */}
        <div className="absolute bottom-12 text-xs font-mono text-zinc-600 tracking-widest uppercase">
          Benny Asante Duah
        </div>
      </div>
    </main>
  );
}
