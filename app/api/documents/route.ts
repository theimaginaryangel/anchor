import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canDelete } from '@/lib/auth/roles';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
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
