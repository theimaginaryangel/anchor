/**
 * Document Chunker
 *
 * Takes raw Textract output and splits it into chunks that follow
 * the document's own structure — headings and paragraphs, not
 * arbitrary character counts. Each chunk keeps a reference to its
 * page number and position so citations can point back to the source.
 *
 * Implemented in Phase 3.
 */

export interface Chunk {
  content: string;
  pageNumber: number;
  sectionHeading: string | null;
  positionStart: number;
  positionEnd: number;
}

export function chunkDocument(textractOutput: unknown): Chunk[] {
  // Parses Textract blocks into structured chunks.
  // Implemented in Phase 3.
  throw new Error('Not implemented — Phase 3');
}
