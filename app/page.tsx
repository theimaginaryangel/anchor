import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-6xl font-bold mb-4">Anchor</h1>
        <p className="text-xl mb-8 text-center text-gray-600">
          Ask questions about your documents. Get answers with citations.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 font-semibold"
          >
            Sign In
          </Link>
          <a
            href="#"
            className="rounded-md bg-gray-200 px-6 py-3 text-gray-900 hover:bg-gray-300 font-semibold"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
