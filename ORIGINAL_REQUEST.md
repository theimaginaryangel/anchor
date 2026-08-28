# Original User Request

## 2026-08-21T16:21:36Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Small, focused team

This is a single self-contained fix; keep it small and focused.
The goal is to gracefully handle the Gemini API 429 rate limit error (Too Many Requests) in the Anchor app. When the rate limit is exceeded, the UI should display a user-friendly error message instead of the raw JSON error string.

Working directory: d:\Anchor
Integrity mode: development

## Requirements

### R1. Graceful Rate Limit Handling
When the Gemini API returns a 429 Too Many Requests error, the application must catch this specific error and prevent it from bubbling up as a raw JSON string to the UI.

### R2. User-Friendly Error Message
The UI must display a clear, user-friendly message explaining that the rate limit has been exceeded, rather than the raw API error details. 

## Acceptance Criteria

### Automated Verification
- [ ] A programmatic test (unit or integration) is added or updated that mocks a 429 rate limit error from the Gemini API.
- [ ] The test objectively verifies that the user-friendly error message is rendered in the UI, and the raw error JSON is not present.

## 2026-08-21T17:58:34Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Small, focused team

This is a single self-contained fix; keep it small and focused.
The goal is to implement IP-based rate limiting on the chat API endpoint to prevent individual users, bots, or scrapers from spamming the Gemini API and consuming the free quota.

Working directory: d:\Anchor
Integrity mode: development

## Requirements

### R1. IP-Based Rate Limiter
Implement an in-memory rate limiter (e.g., using an LRU cache or Map) in the Next.js API route (`app/api/chat/route.ts`). It should track the IP address of the incoming request. Do not use external services like Redis so that the user does not need to configure any API keys.

### R2. Strict Limits
Limit each IP to a small, reasonable number of requests per hour (e.g., 5-10 requests). If the IP exceeds this limit, reject the request with a 429 Too Many Requests status before calling the Gemini API.

### R3. Proper Header Extraction
Ensure the IP address is extracted correctly from the request headers (e.g., `x-forwarded-for`), as Next.js applications are often deployed behind proxies.

## Acceptance Criteria

### Automated Verification
- [ ] A programmatic test (unit or integration) is added that simulates requests from the same IP address.
- [ ] The test verifies that requests under the limit succeed, and requests over the limit are rejected with a 429 status without the Gemini API ever being called.
