// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '@/app/(app)/chat/page';

describe('ChatPage UI - Gemini 429 Rate Limit Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders user-friendly rate limit message and ensures raw JSON is not displayed when API returns 429', async () => {
    const rawJsonError = JSON.stringify([
      {
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'RATE_LIMIT_EXCEEDED',
        domain: 'googleapis.com',
        metadata: { service: 'generativelanguage.googleapis.com' }
      }
    ]);

    const rawErrorMessage = `[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent: [429 Too Many Requests] Resource has been exhausted (e.g. check quota). ${rawJsonError}`;

    // Mock fetch returning HTTP 429 with standard rate limit payload
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Gemini API rate limit exceeded (Too Many Requests). Please wait a moment before submitting another request.',
        code: 'RATE_LIMIT_EXCEEDED'
      })
    });

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Tell me about the documents' } });

    const form = input.closest('div');
    const sendButton = form?.querySelector('button');
    expect(sendButton).toBeTruthy();
    fireEvent.click(sendButton!);

    // Wait for the assistant message to appear
    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';

    // Verify user-friendly message is present
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded');

    // Verify raw JSON and internal error details are NOT present
    expect(pageText).not.toContain('GoogleGenerativeAI Error');
    expect(pageText).not.toContain('type.googleapis.com');
    expect(pageText).not.toContain('generativelanguage.googleapis.com');
    expect(pageText).not.toContain('{"@type"');
    expect(pageText).not.toContain('*(If you are on Vercel');
  });

  it('renders rate limit message even if API returns 429 with empty error field or only code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        code: 'RATE_LIMIT_EXCEEDED'
      })
    });

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'What is in the document?' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded (Too Many Requests). Please wait a moment');
    expect(pageText).not.toContain('An unexpected error occurred');
  });

  it('sanitizes raw JSON error if backend passes raw Gemini 429 error string to UI', async () => {
    const rawJsonDetails = '[{"@type":"type.googleapis.com/google.rpc.ErrorInfo","reason":"RATE_LIMIT_EXCEEDED"}]';
    const rawApiError = `[GoogleGenerativeAI Error]: [429 Too Many Requests] Resource has been exhausted. ${rawJsonDetails}`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: rawApiError
      })
    });

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Summarize the resume' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';

    // Verify clean message
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded');

    // Verify raw JSON is completely absent
    expect(pageText).not.toContain(rawJsonDetails);
    expect(pageText).not.toContain('GoogleGenerativeAI Error');
    expect(pageText).not.toContain('type.googleapis.com');
    expect(pageText).not.toContain('{"@type"');
  });

  it('detects nested rate limit error object even if HTTP status is 500', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 429,
          message: 'Resource has been exhausted (e.g. check quota).'
        }
      })
    });

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Analyze the financials' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded');
    expect(pageText).not.toContain('*(If you are on Vercel');
  });

  it('handles client-side network error with 429 message gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      new Error('fetch failed: 429 Too Many Requests rate limit exceeded')
    );

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Summarize the resume' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded');
    expect(pageText).not.toContain('fetch failed');
  });

  it('sanitizes non-rate-limit 500 raw JSON errors without showing rate limit banner', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: '{"status": 500, "message": "Database query timeout at pg_catalog.pg_tables"}'
      })
    });

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Search anything' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText(/communicating with the AI service/i)).toBeTruthy();
    });

    const pageText = container.textContent || '';
    expect(pageText).not.toContain('Rate Limit Exceeded');
    expect(pageText).not.toContain('pg_catalog');
    expect(pageText).not.toContain('Database query timeout');
  });

  it('handles HTTP 429 responses where response body is non-JSON or fails to parse', async () => {
    // Simulated cloud edge / proxy 429 HTML or plain-text response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0');
      }
    });

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Summarize the document' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded (Too Many Requests). Please wait a moment');
    expect(pageText).not.toContain('Failed to parse response');
    expect(pageText).not.toContain('SyntaxError');
  });

  it('handles client-side network error with hyphenated rate-limited error message', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      new Error('fetch failed: client is rate-limited by remote host')
    );

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Summarize the document' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded');
    expect(pageText).not.toContain('fetch failed');
  });

  it('handles gRPC resource exhausted details in 500 API response in UI', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        code: 8,
        details: 'Resource has been exhausted (e.g. check quota).'
      })
    });

    const { container } = render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'Search document' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Exceeded')).toBeTruthy();
    });

    const pageText = container.textContent || '';
    expect(pageText).toContain('Rate Limit Exceeded');
    expect(pageText).toContain('Gemini API rate limit exceeded');
  });

  it('renders successfully on normal response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answer: 'Anchor is an enterprise RAG knowledge base application.',
        citations: [],
        routing: { action: 'answer_directly', reasoning: 'overview question' }
      })
    });

    render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask anything...');
    fireEvent.change(input, { target: { value: 'What is Anchor?' } });

    const sendButton = input.closest('div')?.querySelector('button');
    fireEvent.click(sendButton!);

    await waitFor(() => {
      expect(screen.getByText(/Anchor is an enterprise RAG knowledge base application/i)).toBeTruthy();
    });
  });
});
