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
});
