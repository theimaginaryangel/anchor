import { describe, it, expect } from 'vitest';
import {
  isGeminiRateLimitError,
  isRawJsonError,
  getFriendlyErrorMessage,
  RATE_LIMIT_USER_MESSAGE,
  GENERIC_AI_ERROR_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE
} from '@/lib/errors';

describe('Error Handling Utilities', () => {
  describe('isGeminiRateLimitError', () => {
    it('detects numeric and string 429 status code', () => {
      expect(isGeminiRateLimitError(429)).toBe(true);
      expect(isGeminiRateLimitError('429')).toBe(true);
    });

    it('detects object with status 429', () => {
      expect(isGeminiRateLimitError({ status: 429 })).toBe(true);
      expect(isGeminiRateLimitError({ status: '429' })).toBe(true);
      expect(isGeminiRateLimitError({ statusCode: 429 })).toBe(true);
      expect(isGeminiRateLimitError({ statusCode: '429' })).toBe(true);
      expect(isGeminiRateLimitError({ response: { status: 429 } })).toBe(true);
      expect(isGeminiRateLimitError({ code: 429 })).toBe(true);
    });

    it('detects statusText "Too Many Requests"', () => {
      expect(isGeminiRateLimitError({ statusText: 'Too Many Requests' })).toBe(true);
      expect(isGeminiRateLimitError({ response: { statusText: 'Too Many Requests' } })).toBe(true);
    });

    it('detects code RATE_LIMIT_EXCEEDED or RESOURCE_EXHAUSTED', () => {
      expect(isGeminiRateLimitError({ code: 'RATE_LIMIT_EXCEEDED' })).toBe(true);
      expect(isGeminiRateLimitError({ code: 'RESOURCE_EXHAUSTED' })).toBe(true);
      expect(isGeminiRateLimitError({ status: 'RESOURCE_EXHAUSTED' })).toBe(true);
    });

    it('detects nested error objects with 429 details', () => {
      expect(
        isGeminiRateLimitError({
          error: {
            code: 429,
            message: 'Resource has been exhausted (e.g. check quota).',
            status: 'RESOURCE_EXHAUSTED'
          }
        })
      ).toBe(true);

      expect(
        isGeminiRateLimitError({
          error: {
            message: 'Too many requests received'
          }
        })
      ).toBe(true);
    });

    it('detects rate limit in error.cause chain', () => {
      const cause = { status: 429, message: 'Quota exceeded' };
      const chainedError = new Error('Database query failed', { cause });
      expect(isGeminiRateLimitError(chainedError)).toBe(true);
    });

    it('detects rate limit in response.data or data payload (Axios / fetch wrappers)', () => {
      expect(
        isGeminiRateLimitError({
          response: {
            data: {
              error: {
                code: 429,
                message: 'Resource exhausted'
              }
            }
          }
        })
      ).toBe(true);

      expect(
        isGeminiRateLimitError({
          data: {
            error: {
              code: 429,
              message: 'Quota exceeded'
            }
          }
        })
      ).toBe(true);
    });

    it('detects rate limit in aggregate / multi-error structures', () => {
      expect(
        isGeminiRateLimitError({
          errors: [
            new Error('Normal validation passed'),
            new Error('429 Too Many Requests')
          ]
        })
      ).toBe(true);
    });

    it('detects GoogleGenerativeAIFetchError errorDetails array and gRPC details', () => {
      const err = {
        name: 'GoogleGenerativeAIFetchError',
        status: 429,
        errorDetails: [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason: 'RATE_LIMIT_EXCEEDED',
            domain: 'googleapis.com'
          }
        ]
      };
      expect(isGeminiRateLimitError(err)).toBe(true);

      expect(isGeminiRateLimitError({ details: 'Resource has been exhausted (e.g. check quota).' })).toBe(true);
      expect(isGeminiRateLimitError({ details: [{ reason: 'RATE_LIMIT_EXCEEDED' }] })).toBe(true);
      expect(isGeminiRateLimitError({ reason: 'RATE_LIMIT_EXCEEDED' })).toBe(true);
      expect(isGeminiRateLimitError({ reason: 'RESOURCE_EXHAUSTED' })).toBe(true);
      expect(isGeminiRateLimitError({ statusText: 'Quota Exceeded' })).toBe(true);
      expect(isGeminiRateLimitError({ statusText: 'Resource Exhausted' })).toBe(true);
      expect(isGeminiRateLimitError({ status: '429 Too Many Requests' })).toBe(true);
    });

    it('detects rate limit keywords in error message string including hyphenated and underscored forms', () => {
      expect(
        isGeminiRateLimitError(
          new Error('[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent: [429 Too Many Requests] Resource has been exhausted (e.g. check quota).')
        )
      ).toBe(true);

      expect(
        isGeminiRateLimitError(
          new Error('You have exceeded your current quota, please check your plan and billing details.')
        )
      ).toBe(true);

      expect(isGeminiRateLimitError('429 Too Many Requests')).toBe(true);
      expect(isGeminiRateLimitError('Rate limit exceeded. Please try again.')).toBe(true);
      expect(isGeminiRateLimitError('API Rate limit reached for current model')).toBe(true);
      expect(isGeminiRateLimitError('Client is rate-limited: please retry later')).toBe(true);
      expect(isGeminiRateLimitError('Error: rate-limit-exceeded')).toBe(true);
      expect(isGeminiRateLimitError('Error: rate_limit_exceeded')).toBe(true);
      expect(isGeminiRateLimitError('Model is currently rate-limiting incoming requests')).toBe(true);
      expect(isGeminiRateLimitError('Per-minute requests per minute limit reached')).toBe(true);
      expect(isGeminiRateLimitError('Hit rpm limit for free tier')).toBe(true);
      expect(isGeminiRateLimitError('Hit tpm limit on tokens')).toBe(true);
      expect(isGeminiRateLimitError('Daily quota limit exceeded')).toBe(true);
      expect(isGeminiRateLimitError('Upstream returned 429 Too Many Requests')).toBe(true);
      expect(isGeminiRateLimitError('Got 429 from Google endpoint')).toBe(true);
      expect(isGeminiRateLimitError('(HTTP 429: Too Many Requests)')).toBe(true);
      expect(isGeminiRateLimitError('(429 Too Many Requests)')).toBe(true);
      expect(isGeminiRateLimitError('429 Client Error: Too Many Requests')).toBe(true);
      expect(isGeminiRateLimitError('Request failed with status code 429')).toBe(true);
    });

    it('returns false for non-rate-limit errors and does NOT false-positive on numbers containing 429', () => {
      expect(isGeminiRateLimitError(null)).toBe(false);
      expect(isGeminiRateLimitError(undefined)).toBe(false);
      expect(isGeminiRateLimitError(new Error('Internal server error'))).toBe(false);
      expect(isGeminiRateLimitError({ status: 500, message: 'Database failure' })).toBe(false);
      expect(isGeminiRateLimitError({ status: 401, message: 'Unauthorized' })).toBe(false);
      expect(isGeminiRateLimitError({ status: 404, message: 'Not Found' })).toBe(false);
      expect(isGeminiRateLimitError('Invalid document format')).toBe(false);

      // Adversarial cases: digit sequences containing 429 in other contexts
      expect(isGeminiRateLimitError(new Error('User 14298 not authorized'))).toBe(false);
      expect(isGeminiRateLimitError(new Error('Document 429 was deleted'))).toBe(false);
      expect(isGeminiRateLimitError('Order #4290 status: completed')).toBe(false);
      expect(isGeminiRateLimitError('Connection failed on port 4290')).toBe(false);
      expect(isGeminiRateLimitError('Room 429 is unavailable')).toBe(false);
      expect(isGeminiRateLimitError('Found 429 matching results')).toBe(false);
      expect(isGeminiRateLimitError('Invoice #429 paid in full')).toBe(false);
    });
  });

  describe('isRawJsonError', () => {
    it('identifies JSON object string', () => {
      expect(isRawJsonError('{"error": {"code": 429, "message": "Resource exhausted"}}')).toBe(true);
    });

    it('identifies JSON array string', () => {
      expect(isRawJsonError('[{"code": 500, "message": "Backend crash"}]')).toBe(true);
    });

    it('identifies embedded JSON in string prefix', () => {
      expect(isRawJsonError('Failed with response: {"error": {"code": 500, "message": "Syntax error"}}')).toBe(true);
    });

    it('identifies GoogleGenerativeAI Error strings containing metadata', () => {
      expect(isRawJsonError('[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/...')).toBe(true);
      expect(isRawJsonError('Something failed: [{"@type": "type.googleapis.com/google.rpc.ErrorInfo"}]')).toBe(true);
    });

    it('returns false for friendly plain text messages', () => {
      expect(isRawJsonError('Rate limit exceeded. Please wait a moment.')).toBe(false);
      expect(isRawJsonError('Failed to search documents')).toBe(false);
      expect(isRawJsonError('Please select a valid PDF file.')).toBe(false);
    });
  });

  describe('getFriendlyErrorMessage', () => {
    it('returns user-friendly message for rate limit errors', () => {
      const rawError = new Error('[GoogleGenerativeAI Error]: [429 Too Many Requests] [{"@type":"type.googleapis.com/google.rpc.ErrorInfo"}]');
      expect(getFriendlyErrorMessage(rawError)).toBe(RATE_LIMIT_USER_MESSAGE);
    });

    it('returns user-friendly message for numeric or string status 429', () => {
      expect(getFriendlyErrorMessage(429)).toBe(RATE_LIMIT_USER_MESSAGE);
      expect(getFriendlyErrorMessage('429')).toBe(RATE_LIMIT_USER_MESSAGE);
    });

    it('returns user-friendly message for nested rate limit objects', () => {
      expect(
        getFriendlyErrorMessage({
          error: {
            code: 429,
            message: 'Resource has been exhausted (e.g. check quota).'
          }
        })
      ).toBe(RATE_LIMIT_USER_MESSAGE);
    });

    it('returns user-friendly message for response.data rate limit objects', () => {
      expect(
        getFriendlyErrorMessage({
          response: {
            data: {
              error: {
                message: 'Quota exceeded for project'
              }
            }
          }
        })
      ).toBe(RATE_LIMIT_USER_MESSAGE);
    });

    it('returns user-friendly message when cause contains rate limit', () => {
      const chainedError = new Error('Generation failed', { cause: { status: 429 } });
      expect(getFriendlyErrorMessage(chainedError)).toBe(RATE_LIMIT_USER_MESSAGE);
    });

    it('sanitizes raw JSON errors to prevent technical leaks', () => {
      const rawJson = '{"error": {"code": 500, "message": "Internal error in Google backend", "status": "INTERNAL"}}';
      const result = getFriendlyErrorMessage(rawJson);
      expect(result).toBe(GENERIC_AI_ERROR_MESSAGE);
      expect(result).not.toContain('{');
      expect(result).not.toContain('Google backend');
    });

    it('sanitizes embedded JSON in error strings', () => {
      const embedded = 'API call failed: {"message": "SQL syntax error at line 4", "code": 500}';
      expect(getFriendlyErrorMessage(embedded)).toBe(GENERIC_AI_ERROR_MESSAGE);
    });

    it('preserves clean user-facing error messages', () => {
      expect(getFriendlyErrorMessage('Please select a valid PDF file.')).toBe('Please select a valid PDF file.');
      expect(getFriendlyErrorMessage({ message: 'Document not found' })).toBe('Document not found');
    });

    it('handles unexpected empty objects gracefully', () => {
      expect(getFriendlyErrorMessage({})).toBe(UNEXPECTED_ERROR_MESSAGE);
      expect(getFriendlyErrorMessage(null)).toBe(UNEXPECTED_ERROR_MESSAGE);
      expect(getFriendlyErrorMessage(undefined)).toBe(UNEXPECTED_ERROR_MESSAGE);
    });
  });
});
