/**
 * Error handling utilities for Gemini API & Anchor application
 */

export const RATE_LIMIT_USER_MESSAGE =
  'Gemini API rate limit exceeded (Too Many Requests). Please wait a moment before submitting another request.';

export const GENERIC_AI_ERROR_MESSAGE =
  'An error occurred while communicating with the AI service. Please try again.';

export const UNEXPECTED_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again.';

/**
 * Determines whether an error is a Gemini 429 rate limit error.
 */
export function isGeminiRateLimitError(error: unknown): boolean {
  if (!error) return false;

  // Handle numeric / string status code directly
  if (error === 429 || error === '429') return true;

  if (typeof error === 'object') {
    const err = error as any;

    // Check cause property (ES2022 error chaining)
    if (err.cause && isGeminiRateLimitError(err.cause)) {
      return true;
    }

    // Direct HTTP status checks (numeric or string)
    if (
      Number(err.status) === 429 ||
      Number(err.statusCode) === 429 ||
      Number(err.response?.status) === 429 ||
      Number(err.code) === 429
    ) {
      return true;
    }

    // Status text check (checks any rate limit keyword in statusText)
    if (
      typeof err.statusText === 'string' &&
      containsRateLimitSignature(err.statusText)
    ) {
      return true;
    }

    if (
      typeof err.response?.statusText === 'string' &&
      containsRateLimitSignature(err.response.statusText)
    ) {
      return true;
    }

    // Custom code or reason property
    if (
      err.code === 'RATE_LIMIT_EXCEEDED' ||
      err.code === 'RESOURCE_EXHAUSTED' ||
      err.status === 'RESOURCE_EXHAUSTED' ||
      err.reason === 'RATE_LIMIT_EXCEEDED' ||
      err.reason === 'RESOURCE_EXHAUSTED'
    ) {
      return true;
    }

    if (typeof err.status === 'string' && containsRateLimitSignature(err.status)) {
      return true;
    }

    if (typeof err.statusCode === 'string' && containsRateLimitSignature(err.statusCode)) {
      return true;
    }

    if (typeof err.reason === 'string' && containsRateLimitSignature(err.reason)) {
      return true;
    }

    // Check errorDetails or details array from GoogleGenerativeAIFetchError / gRPC
    const detailsArray = Array.isArray(err.errorDetails)
      ? err.errorDetails
      : Array.isArray(err.details)
      ? err.details
      : null;

    if (detailsArray) {
      for (const detail of detailsArray) {
        if (
          detail?.reason === 'RATE_LIMIT_EXCEEDED' ||
          detail?.reason === 'RESOURCE_EXHAUSTED' ||
          (typeof detail === 'string' && containsRateLimitSignature(detail)) ||
          (detail?.['@type']?.includes('ErrorInfo') &&
            (JSON.stringify(detail).includes('RATE_LIMIT') ||
              JSON.stringify(detail).includes('RESOURCE_EXHAUSTED') ||
              JSON.stringify(detail).toLowerCase().includes('quota')))
        ) {
          return true;
        }
      }
    }

    // Check details property when it is a string (gRPC format)
    if (typeof err.details === 'string' && containsRateLimitSignature(err.details)) {
      return true;
    }

    // Check aggregate / multi-error arrays (AggregateError, Google API errors array)
    if (Array.isArray(err.errors)) {
      for (const subErr of err.errors) {
        if (isGeminiRateLimitError(subErr)) {
          return true;
        }
      }
    }

    // Check nested error object (e.g. { error: { code: 429, message: "..." } })
    if (err.error && typeof err.error === 'object') {
      if (isGeminiRateLimitError(err.error)) {
        return true;
      }
    }

    // Check response body / data payload (e.g. Axios, fetch wrappers)
    if (err.response?.data && typeof err.response.data === 'object') {
      if (isGeminiRateLimitError(err.response.data)) {
        return true;
      }
    }

    if (err.data && typeof err.data === 'object') {
      if (isGeminiRateLimitError(err.data)) {
        return true;
      }
    }

    // Check message property
    if (typeof err.message === 'string' && containsRateLimitSignature(err.message)) {
      return true;
    }

    // Check error property when it is a string
    if (typeof err.error === 'string' && containsRateLimitSignature(err.error)) {
      return true;
    }
  }

  // String check
  if (typeof error === 'string') {
    return containsRateLimitSignature(error);
  }

  return false;
}

function containsRateLimitSignature(str: string): boolean {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed === '429') return true;

  const lower = str.toLowerCase();

  // Specific rate limit / quota keywords (including hyphenated, underscored, and variations)
  if (
    lower.includes('too many requests') ||
    lower.includes('resource exhausted') ||
    lower.includes('resources exhausted') ||
    lower.includes('resource is exhausted') ||
    lower.includes('resource_exhausted') ||
    lower.includes('resource-exhausted') ||
    lower.includes('resource has been exhausted') ||
    lower.includes('rate_limit_exceeded') ||
    lower.includes('rate-limit-exceeded') ||
    lower.includes('rate limit exceeded') ||
    lower.includes('rate limit reached') ||
    lower.includes('rate limit') ||
    lower.includes('rate-limit') ||
    lower.includes('rate_limit') ||
    lower.includes('rate-limited') ||
    lower.includes('rate limited') ||
    lower.includes('rate-limiting') ||
    lower.includes('quota exceeded') ||
    lower.includes('quota_exceeded') ||
    lower.includes('quota-exceeded') ||
    lower.includes('check quota') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('quota limit') ||
    lower.includes('quota-limit') ||
    lower.includes('quota_limit') ||
    lower.includes('rpm limit') ||
    lower.includes('tpm limit') ||
    lower.includes('requests per minute')
  ) {
    return true;
  }

  // 429 in HTTP / API error context (avoids false positives on numbers like "User 14298", "Room 429", "Page 429")
  if (
    /\[\s*429\s*\]/.test(str) ||
    /\[\s*429\s+too many requests\s*\]/i.test(str) ||
    /\(\s*(?:http\s+)?429(?:\s+[^)]+)?\s*\)/i.test(str) ||
    /\b(?:status|statuscode|code|http|error|status\s+code|response|upstream|returned|received|got)\s*[:=]?\s*429\b/i.test(str) ||
    /\b429\s+(?:too many requests|rate limit|quota|resource exhausted|error|client error|response|status|statuscode)\b/i.test(str) ||
    /"code"\s*:\s*429/.test(str) ||
    /"status"\s*:\s*429/.test(str) ||
    /"status"\s*:\s*"RESOURCE_EXHAUSTED"/i.test(str)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a string contains raw JSON error details or API traceback signatures
 */
export function isRawJsonError(str: string): boolean {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();

  // Full JSON object or array
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return true;
  }

  // Embedded JSON object or array within text
  if (/\{[\s\S]*"[a-zA-Z0-9_@.-]+"\s*:[\s\S]*\}/.test(str)) {
    return true;
  }

  return (
    str.includes('[GoogleGenerativeAI Error]') ||
    str.includes('"@type"') ||
    str.includes('googleapis.com') ||
    str.includes('"reason"') ||
    str.includes('"message"') ||
    str.includes('"status"') ||
    str.includes('RATE_LIMIT_EXCEEDED') ||
    str.includes('RESOURCE_EXHAUSTED')
  );
}

/**
 * Formats any error into a clean user-facing string, ensuring raw JSON is never leaked.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (isGeminiRateLimitError(error)) {
    return RATE_LIMIT_USER_MESSAGE;
  }

  if (typeof error === 'string') {
    if (isRawJsonError(error)) {
      return GENERIC_AI_ERROR_MESSAGE;
    }
    return error || UNEXPECTED_ERROR_MESSAGE;
  }

  if (error && typeof error === 'object') {
    const err = error as any;

    if (err.cause && isGeminiRateLimitError(err.cause)) {
      return RATE_LIMIT_USER_MESSAGE;
    }

    const msg =
      typeof err.message === 'string' && err.message.trim()
        ? err.message
        : typeof err.error === 'string' && err.error.trim()
        ? err.error
        : typeof err.error?.message === 'string' && err.error.message.trim()
        ? err.error.message
        : typeof err.response?.data?.error?.message === 'string' && err.response.data.error.message.trim()
        ? err.response.data.error.message
        : typeof err.response?.data?.message === 'string' && err.response.data.message.trim()
        ? err.response.data.message
        : typeof err.data?.error?.message === 'string' && err.data.error.message.trim()
        ? err.data.error.message
        : typeof err.data?.message === 'string' && err.data.message.trim()
        ? err.data.message
        : typeof err.details === 'string' && err.details.trim()
        ? err.details
        : '';

    if (msg) {
      if (isGeminiRateLimitError(msg)) {
        return RATE_LIMIT_USER_MESSAGE;
      }
      if (isRawJsonError(msg)) {
        return GENERIC_AI_ERROR_MESSAGE;
      }
      return msg;
    }
  }

  return UNEXPECTED_ERROR_MESSAGE;
}
