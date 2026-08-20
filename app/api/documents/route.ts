import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canDelete } from '@/lib/auth/roles';

/**
 * GET /api/documents
 * Lists all documents the current user can access.
 * Auth: admin and viewer.
 * Implemented in Phase 2.
 */
export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Not implemented', phase: 'Phase 2 — Document ingestion' },
    { status: 501 }
  );
}

/**
 * DELETE /api/documents
 * Deletes a document and its chunks/embeddings.
 * Auth: admin only.
 * Implemented in Phase 2.
 */
export async function DELETE() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  if (!canDelete(session.user?.role)) {
    return NextResponse.json({ error: 'Not authorized to delete documents' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'Not implemented', phase: 'Phase 2 — Document ingestion' },
    { status: 501 }
  );
}
