# Original User Request

## Initial Request — 2026-08-21T16:22:03Z

Handle Gemini API 429 rate limit error (Too Many Requests) gracefully in the Anchor app.
- When Gemini API returns 429 Too Many Requests, catch this specific error and prevent it from bubbling up as a raw JSON string to the UI.
- UI must display a clear, user-friendly message explaining rate limit exceeded rather than raw API error details.
- Add/update a programmatic test (unit or integration) that mocks a 429 rate limit error and verifies the user-friendly error message is rendered in UI and raw JSON is not present.

Please execute the SWE Light protocol to implement, test, and review this fix.

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
