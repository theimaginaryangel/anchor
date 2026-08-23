import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canQuery } from '@/lib/auth/roles';
import { searchDocuments } from '@/lib/retrieval/search';
import { generateAnswer, routeQuery } from '@/lib/chat/gemini';
import { isGeminiRateLimitError, RATE_LIMIT_USER_MESSAGE, getFriendlyErrorMessage } from '@/lib/errors';
import { chatRateLimiter, getClientIp } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting Check (prevent spamming Gemini API)
    const ip = getClientIp(req);
    const rateLimit = chatRateLimiter.check(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: RATE_LIMIT_USER_MESSAGE,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
          },
        }
      );
    }

    // 2. Auth check
    const session = await auth();
    if (!session || !canQuery((session?.user as any)?.role)) {
      return NextResponse.json({ error: 'Not authorized to query documents' }, { status: 403 });
    }

    const { question, documentId } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Routing Loop (cap at 2 iterations total = 1 initial + 1 re-search)
    const MAX_ATTEMPTS = 2;
    let attempts = 0;
    const previousSearches: string[] = [];
    let routingTrace = null;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      
      // 1. Route the query
      const decision = await routeQuery(question, previousSearches);
      
      // Store the trace for the UI (we'll send the final one)
      routingTrace = decision;

      if (decision.action === 'ask_clarification' || decision.action === 'answer_directly') {
        return NextResponse.json({
          answer: decision.response_text,
          citations: [],
          routing: routingTrace
        });
      }

      if (decision.action === 'search_document') {
        const searchQuery = decision.response_text;
        previousSearches.push(searchQuery);

        // 2. Vector Search using the refined query
        const searchResults = await searchDocuments(searchQuery, 0.5, 5, documentId);

        if (searchResults.length === 0) {
          // If no chunks found, let it loop back and try a different query or ask clarification
          continue; 
        }

        // 3. Format chunks for Gemini
        const chunksForGemini = searchResults.map(r => ({
          id: r.chunkId,
          content: r.content,
          pageNumber: r.pageNumber,
          sectionHeading: r.sectionHeading
        }));

        // 4. Generate Answer
        const answer = await generateAnswer(question, chunksForGemini);

        const insufficientInfoFlag = "I don't have enough information";
        if (answer.answer.includes(insufficientInfoFlag) && attempts < MAX_ATTEMPTS) {
          // Let it loop back for one more try
          continue; 
        }

        // Success (or max attempts reached with insufficient info)
        return NextResponse.json({
          ...answer,
          routing: routingTrace
        });
      }
    }

    // If we exhaust attempts without a final answer:
    return NextResponse.json({
      answer: "I couldn't find enough information in the documents to answer that, even after refining my search.",
      citations: [],
      routing: routingTrace
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);

    if (isGeminiRateLimitError(error)) {
      return NextResponse.json({ 
        error: RATE_LIMIT_USER_MESSAGE,
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 });
    }

    const safeMessage = getFriendlyErrorMessage(error);

    return NextResponse.json({ 
      error: safeMessage
    }, { status: 500 });
  }
}
