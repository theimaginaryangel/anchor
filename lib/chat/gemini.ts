/**
 * Gemini Chat Client
 *
 * Takes a user's question and the retrieved chunks, sends them to
 * Google's Gemini API, and gets back an answer that cites its sources.
 * The system prompt tells Gemini to only answer from the provided
 * chunks and to say "I don't have enough information" if the chunks
 * don't cover the question.
 *
 * Implemented in Phase 5.
 *
 * Dependencies: @google/generative-ai
 */

export interface CitedAnswer {
  answer: string;
  citations: Array<{
    chunkId: string;
    pageNumber: number;
    sectionHeading: string | null;
    relevantText: string;
  }>;
}

export async function generateAnswer(
  question: string,
  chunks: Array<{ id: string; content: string; pageNumber: number; sectionHeading: string | null }>
): Promise<CitedAnswer> {
  // Sends question + chunks to Gemini, parses the cited answer.
  // Implemented in Phase 5.
  throw new Error('Not implemented — Phase 5');
}
