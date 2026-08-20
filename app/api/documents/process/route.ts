import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTextractResult } from '@/lib/ocr/textract';
import { chunkDocument } from '@/lib/chunking/chunker';
import { embedBatch } from '@/lib/embeddings/bedrock';

export async function POST() {
  try {
    // 1. Find all documents that are currently 'processing'
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('status', 'processing')
      .not('textract_job_id', 'is', null);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch processing documents' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ message: 'No documents pending processing' });
    }

    let processedCount = 0;

    // 2. Loop through each and check AWS Textract
    for (const doc of documents) {
      try {
        const result: any = await getTextractResult(doc.textract_job_id);

        if (result.JobStatus === 'SUCCEEDED') {
          // 3. Chunk the text
          const chunks = chunkDocument(result);

          if (chunks.length > 0) {
            // 4. Save chunks to Supabase
            const chunkInserts = chunks.map((c, idx) => ({
              document_id: doc.id,
              chunk_index: idx,
              content: c.content,
              page_number: c.pageNumber,
              section_heading: c.sectionHeading,
              position_start: c.positionStart,
              position_end: c.positionEnd,
            }));

            const { data: savedChunks, error: chunkError } = await supabase
              .from('chunks')
              .insert(chunkInserts)
              .select('id, content');

            if (chunkError) {
              console.error('Failed to insert chunks:', chunkError);
              continue;
            }

            // 5. Generate embeddings for the chunks using AWS Bedrock
            const textsToEmbed = savedChunks.map(c => c.content);
            const vectors = await embedBatch(textsToEmbed);

            // 6. Save embeddings to Supabase
            const embeddingInserts = vectors.map((vec, idx) => ({
              chunk_id: savedChunks[idx].id,
              embedding: JSON.stringify(vec), // Store as stringified array for pgvector
            }));

            await supabase.from('embeddings').insert(embeddingInserts);
          }

          // 7. Update document status to ready
          await supabase
            .from('documents')
            .update({ status: 'ready' })
            .eq('id', doc.id);
            
          processedCount++;

        } else if (result.JobStatus === 'FAILED') {
          await supabase
            .from('documents')
            .update({ status: 'failed' })
            .eq('id', doc.id);
        }
      } catch (err) {
        console.error(`Error processing document ${doc.id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedCount,
      message: `Checked ${documents.length} documents, finished processing ${processedCount}` 
    });

  } catch (error) {
    console.error('Process Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
