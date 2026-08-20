import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canQuery } from '@/lib/auth/roles';

/**
 * POST /api/chat
 * RAG query: takes a question, retrieves relevant chunks,
 * generates an answer with citations.
 * Auth: admin and viewer.
 * Implemented in Phase 5.
 */
export async function POST() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  if (!canQuery(session.user?.role)) {
    return NextResponse.json({ error: 'Not authorized to query documents' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'Not implemented', phase: 'Phase 5 — RAG query and citations' },
    { status: 501 }
  );
}
