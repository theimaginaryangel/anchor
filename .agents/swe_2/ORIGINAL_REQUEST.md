# Original User Request

## Initial Request — 2026-08-21T18:00:14Z

Implement IP-based rate limiting on the chat API endpoint to prevent individual users, bots, or scrapers from spamming the Gemini API and consuming the free quota.

### Requirements
1. IP-Based Rate Limiter: Implement an in-memory rate limiter (e.g., using an LRU cache or Map) in the Next.js API route (`app/api/chat/route.ts`). Track the IP address of incoming requests. Do not use external services like Redis.
2. Strict Limits: Limit each IP to a small, reasonable number of requests per hour (e.g., 5-10 requests). If exceeded, reject with 429 Too Many Requests status before calling the Gemini API.
3. Proper Header Extraction: Ensure the IP address is extracted correctly from request headers (e.g., `x-forwarded-for`), supporting proxy deployments.
4. Automated Verification: Add programmatic tests (unit or integration) simulating requests from the same IP, verifying requests under limit succeed and requests over limit reject with 429 without calling Gemini API.
