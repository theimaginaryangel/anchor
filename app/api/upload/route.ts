import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUpload } from '@/lib/auth/roles';
import { uploadDocumentToS3 } from '@/lib/storage/s3';
import { startTextractJob } from '@/lib/ocr/textract';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/upload
 * Handles document upload: file → S3 → Textract job.
 * Auth: admin and viewer.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    if (!canUpload(session.user?.role)) {
      return NextResponse.json({ error: 'Not authorized to upload documents' }, { status: 403 });
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const userId = session.user?.email || 'unknown'; // Using email as user identifier for simplicity in demo
    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to S3
    const s3Key = await uploadDocumentToS3(buffer, fileName, userId);

    // 2. Insert into Supabase (status: processing)
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        filename: fileName,
        s3_key: s3Key,
        uploaded_by: userId,
        status: 'processing'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return NextResponse.json({ error: 'Failed to record document in database' }, { status: 500 });
    }

    // 3. Start Textract Job
    const jobId = await startTextractJob(s3Key);

    // 4. Update Supabase with Job ID
    await supabase
      .from('documents')
      .update({ textract_job_id: jobId })
      .eq('id', document.id);

    return NextResponse.json({ 
      success: true, 
      documentId: document.id,
      message: 'Document uploaded and is now processing'
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}
