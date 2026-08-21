import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { auth } from '@/auth';
import { routeQuery, generateAnswer } from '@/lib/chat/gemini';
import { searchDocuments } from '@/lib/retrieval/search';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/auth/roles', () => ({
  canQuery: vi.fn(() => true),
}));

vi.mock('@/lib/chat/gemini', () => ({
  routeQuery: vi.fn(),
  generateAnswer: vi.fn(),
}));

vi.mock('@/lib/retrieval/search', () => ({
  searchDocuments: vi.fn(),
}));

describe('Chat API Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({ user: { role: 'admin' } });
  });

  const makeRequest = (body: any) => {
    return new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('answers directly without searching', async () => {
    (routeQuery as any).mockResolvedValue({
      action: 'answer_directly',
      reasoning: 'greeting',
      response_text: 'Hello there!'
    });

    const res = await POST(makeRequest({ question: 'Hi' }));
    const data = await res.json();

    expect(data.answer).toBe('Hello there!');
    expect(searchDocuments).not.toHaveBeenCalled();
    expect(data.routing.action).toBe('answer_directly');
  });

  it('asks for clarification without searching', async () => {
    (routeQuery as any).mockResolvedValue({
      action: 'ask_clarification',
      reasoning: 'ambiguous',
      response_text: 'Which deadline?'
    });

    const res = await POST(makeRequest({ question: 'When is it due?' }));
    const data = await res.json();

    expect(data.answer).toBe('Which deadline?');
    expect(searchDocuments).not.toHaveBeenCalled();
    expect(data.routing.action).toBe('ask_clarification');
  });

  it('searches and generates an answer', async () => {
    (routeQuery as any).mockResolvedValue({
      action: 'search_document',
      reasoning: 'needs lookup',
      response_text: 'AWS skills'
    });

    (searchDocuments as any).mockResolvedValue([
      { chunkId: '1', content: 'Knows AWS', pageNumber: 1, sectionHeading: null }
    ]);

    (generateAnswer as any).mockResolvedValue({
      answer: 'He knows AWS.',
      citations: []
    });

    const res = await POST(makeRequest({ question: 'Does Benny know AWS?' }));
    const data = await res.json();

    expect(searchDocuments).toHaveBeenCalledWith('AWS skills', 0.5, 5, undefined);
    expect(generateAnswer).toHaveBeenCalled();
    expect(data.answer).toBe('He knows AWS.');
  });

  it('caps re-search loop at 2 attempts', async () => {
    // Router always says search
    (routeQuery as any).mockResolvedValue({
      action: 'search_document',
      reasoning: 'needs lookup',
      response_text: 'AWS skills'
    });

    // Search always returns nothing (triggering a continue/re-search)
    (searchDocuments as any).mockResolvedValue([]);

    const res = await POST(makeRequest({ question: 'Does Benny know AWS?' }));
    const data = await res.json();

    // Should have called routeQuery exactly twice (max attempts)
    expect(routeQuery).toHaveBeenCalledTimes(2);
    // Should have called searchDocuments exactly twice
    expect(searchDocuments).toHaveBeenCalledTimes(2);
    
    // Should return fallback message
    expect(data.answer).toContain("I couldn't find enough information");
  });

  it('handles Gemini 429 rate limit error in routeQuery gracefully without returning raw JSON', async () => {
    const raw429Error = new Error(
      '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent: [429 Too Many Requests] Resource has been exhausted (e.g. check quota). [{"@type":"type.googleapis.com/google.rpc.ErrorInfo","reason":"RATE_LIMIT_EXCEEDED","domain":"googleapis.com"}]'
    );
    (raw429Error as any).status = 429;
    (raw429Error as any).statusText = 'Too Many Requests';

    (routeQuery as any).mockRejectedValue(raw429Error);

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
    expect(data.error).not.toContain('GoogleGenerativeAI Error');
    expect(data.error).not.toContain('type.googleapis.com');
    expect(data.error).not.toContain('{"@type"');
  });

  it('handles Gemini 429 rate limit error in searchDocuments / embeddings gracefully', async () => {
    (routeQuery as any).mockResolvedValue({
      action: 'search_document',
      reasoning: 'needs lookup',
      response_text: 'AWS skills'
    });

    const rateLimitError = new Error('429 Too Many Requests: quota exceeded');
    (rateLimitError as any).status = 429;
    (searchDocuments as any).mockRejectedValue(rateLimitError);

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
  });

  it('handles Gemini 429 rate limit error in generateAnswer gracefully without leaking raw JSON', async () => {
    (routeQuery as any).mockResolvedValue({
      action: 'search_document',
      reasoning: 'needs lookup',
      response_text: 'AWS skills'
    });

    (searchDocuments as any).mockResolvedValue([
      { chunkId: '1', content: 'Doc content', pageNumber: 1, sectionHeading: null }
    ]);

    const geminiFetchError = {
      name: 'GoogleGenerativeAIFetchError',
      message: '[GoogleGenerativeAI Error]: [429 Too Many Requests] Resource has been exhausted',
      status: 429,
      statusText: 'Too Many Requests',
      errorDetails: [
        {
          '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
          reason: 'RATE_LIMIT_EXCEEDED',
          domain: 'googleapis.com'
        }
      ]
    };

    (generateAnswer as any).mockRejectedValue(geminiFetchError);

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
    expect(data.error).not.toContain('GoogleGenerativeAI Error');
    expect(data.error).not.toContain('type.googleapis.com');
  });

  it('handles chained error with 429 cause gracefully', async () => {
    (routeQuery as any).mockRejectedValue(
      new Error('Model execution failed', { cause: { status: 429, message: 'Resource exhausted' } })
    );

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
  });

  it('handles nested response object rate limit error (Google Cloud / REST payload)', async () => {
    (routeQuery as any).mockRejectedValue({
      response: {
        status: 429,
        data: {
          error: {
            code: 429,
            message: 'Resource has been exhausted (e.g. check quota).'
          }
        }
      }
    });

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
  });

  it('handles hyphenated rate-limited error from SDK or proxy', async () => {
    (routeQuery as any).mockRejectedValue(
      new Error('Client is rate-limited: please wait before retrying')
    );

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
  });

  it('handles gRPC resource exhausted details in routeQuery', async () => {
    (routeQuery as any).mockRejectedValue({
      code: 8,
      details: 'Resource has been exhausted (e.g. check quota).'
    });

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
  });

  it('handles statusText "Quota Exceeded" in routeQuery', async () => {
    (routeQuery as any).mockRejectedValue({
      statusText: 'Quota Exceeded'
    });

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('rate limit exceeded');
  });

  it('sanitizes unexpected 500 error with raw JSON payload without leaking', async () => {
    (routeQuery as any).mockRejectedValue(
      new Error('{"error": {"code": 500, "message": "Database query syntax error in postgres driver"}}')
    );

    const res = await POST(makeRequest({ question: 'What are the skills?' }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('An error occurred while communicating with the AI service. Please try again.');
    expect(data.error).not.toContain('postgres driver');
    expect(data.error).not.toContain('{');
  });
});
