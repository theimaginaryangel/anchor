import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUpload } from '@/lib/auth/roles';

/**
 * POST /api/upload
 * Handles document upload: file → S3 → Textract job.
 * Auth: admin only.
 * Implemented in Phase 2.
 */
export async function POST() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  if (!canUpload(session.user?.role)) {
    return NextResponse.json({ error: 'Not authorized to upload documents' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'Not implemented', phase: 'Phase 2 — Document ingestion' },
    { status: 501 }
  );
}
