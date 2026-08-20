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

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  pageNumber: number;
  sectionHeading: string | null;
  similarity: number;
}

export async function searchChunks(
  queryEmbedding: number[],
  options?: { documentId?: string; topK?: number; threshold?: number }
): Promise<SearchResult[]> {
  // Calls the match_chunks RPC function in Supabase.
  // Implemented in Phase 4.
  throw new Error('Not implemented — Phase 4');
}
