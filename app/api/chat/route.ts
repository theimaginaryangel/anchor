import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canQuery } from '@/lib/auth/roles';
import { searchDocuments } from '@/lib/retrieval/search';
import { generateAnswer } from '@/lib/chat/gemini';

export async function POST(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session || !canQuery((session?.user as any)?.role)) {
      return NextResponse.json({ error: 'Not authorized to query documents' }, { status: 403 });
    }

    const { question, documentId } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // 1. Vector Search
    const searchResults = await searchDocuments(question, 0.5, 5, documentId);

    if (searchResults.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information in the documents to answer your question.",
        citations: []
      });
    }

    // 2. Format chunks for Gemini
    const chunksForGemini = searchResults.map(r => ({
      id: r.chunkId,
      content: r.content,
      pageNumber: r.pageNumber,
      sectionHeading: r.sectionHeading
    }));

    // 3. Generate Answer
    const answer = await generateAnswer(question, chunksForGemini);

    return NextResponse.json(answer);

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 });
  }
}
