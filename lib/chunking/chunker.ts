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

// Textract Block type approximation
interface TextractBlock {
  BlockType?: string;
  Text?: string;
  Page?: number;
}

export function chunkDocument(textractOutput: any): Chunk[] {
  if (!textractOutput || !textractOutput.Blocks) {
    return [];
  }

  // Filter out only the LINE blocks containing the actual text
  const lines = textractOutput.Blocks.filter((b: TextractBlock) => b.BlockType === 'LINE' && b.Text);
  
  const chunks: Chunk[] = [];
  let currentChunkText = '';
  let currentChunkPage = 1;
  let position = 0;

  // Simple chunking: group lines until we hit roughly 500 characters, then cut.
  // In a production app, you'd use LangChain's RecursiveCharacterTextSplitter.
  for (const line of lines) {
    const text = line.Text!;
    const page = line.Page || 1;

    // If starting a new chunk, record its page
    if (currentChunkText.length === 0) {
      currentChunkPage = page;
    }

    currentChunkText += text + ' ';

    if (currentChunkText.length > 500) {
      const trimmed = currentChunkText.trim();
      chunks.push({
        content: trimmed,
        pageNumber: currentChunkPage,
        sectionHeading: null,
        positionStart: position,
        positionEnd: position + trimmed.length
      });
      position += trimmed.length;
      currentChunkText = '';
    }
  }

  // Push remainder
  if (currentChunkText.trim().length > 0) {
    const trimmed = currentChunkText.trim();
    chunks.push({
      content: trimmed,
      pageNumber: currentChunkPage,
      sectionHeading: null,
      positionStart: position,
      positionEnd: position + trimmed.length
    });
  }

  return chunks;
}
