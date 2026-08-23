import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUpload } from '@/lib/auth/roles';
import { uploadDocumentToS3 } from '@/lib/storage/s3';
import { startTextractJob } from '@/lib/ocr/textract';
import { supabase } from '@/lib/supabase';
import { uploadRateLimiter, getClientIp } from '@/lib/ratelimit';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/upload
 * Handles document upload: file → S3 → Textract job.
 * Auth: admin and viewer.
 */
export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting Check (prevent upload spam / DoS)
    const ip = getClientIp(req);
    const rateLimit = uploadRateLimiter.check(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          }
        }
      );
    }

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

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must have a .pdf extension' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 10MB limit' }, { status: 413 });
    }

    const userId = session.user?.email || 'unknown'; // Using email as user identifier for simplicity in demo
    const fileName = file.name;

    // Check for duplicate file
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('filename', fileName)
      .limit(1);

    if (existingDocs && existingDocs.length > 0) {
      return NextResponse.json({ error: 'This file already exists' }, { status: 409 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Magic number validation for PDF (ensure it starts with %PDF-)
    if (buffer.length < 5 || buffer.toString('utf-8', 0, 5) !== '%PDF-') {
      return NextResponse.json({ error: 'Invalid file signature. Only genuine PDF files are allowed.' }, { status: 415 });
    }

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
