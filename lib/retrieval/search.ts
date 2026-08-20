/**
 * Vector Similarity Search
 *
 * Queries the pgvector index in Supabase to find the chunks most
 * similar to a given question. Returns the top-k matches, optionally
 * filtered to a specific document.
 *
 * Uses a Postgres function (match_chunks) called via Supabase RPC.
 *
 * Implemented in Phase 4.
 *
 * Dependencies: @supabase/supabase-js
 */

import { supabase } from '@/lib/supabase';
import { embedText } from '@/lib/embeddings/gemini';

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  pageNumber: number;
  sectionHeading: string | null;
  similarity: number;
}

export async function searchDocuments(
  query: string,
  matchThreshold: number = 0.7,
  matchCount: number = 5,
  filterDocumentId?: string
): Promise<SearchResult[]> {
  // 1. Convert the user's query into a vector using AWS Bedrock
  const queryEmbedding = await embedText(query);

  // 2. Call the pgvector similarity search function in Supabase
  const { data: chunks, error } = await supabase.rpc('match_chunks', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_document: filterDocumentId || null
  });

  if (error) {
    console.error('Vector search failed:', error);
    throw new Error('Failed to search documents');
  }

  // 3. Map the database results to our interface
  return (chunks || []).map((chunk: any) => ({
    chunkId: chunk.chunk_id,
    documentId: chunk.document_id,
    content: chunk.content,
    pageNumber: chunk.page_number,
    sectionHeading: chunk.section_heading,
    similarity: chunk.similarity
  }));
}
