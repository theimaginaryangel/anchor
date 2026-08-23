import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, getClientIp, chatRateLimiter } from '@/lib/ratelimit';
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

describe('Rate Limiter Module', () => {
  describe('RateLimiter Class (Unit Tests)', () => {
    it('allows requests within the configured limit and tracks remaining quota', () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60000 });
      const ip = '192.168.1.10';
      const t0 = 1000000;

      const r1 = limiter.check(ip, t0);
      expect(r1.success).toBe(true);
      expect(r1.limit).toBe(3);
      expect(r1.remaining).toBe(2);
      expect(r1.retryAfterSeconds).toBe(0);

      const r2 = limiter.check(ip, t0 + 1000);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = limiter.check(ip, t0 + 2000);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      // 4th request exceeds limit
      const r4 = limiter.check(ip, t0 + 3000);
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.limit).toBe(3);
      expect(r4.resetTime).toBe(t0 + 60000);
      expect(r4.retryAfterSeconds).toBe(Math.ceil((t0 + 60000 - (t0 + 3000)) / 1000));
    });

    it('isolates rate limits between different IP addresses', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 });
      const ip1 = '10.0.0.1';
      const ip2 = '10.0.0.2';
      const t0 = 1000000;

      limiter.check(ip1, t0);
      limiter.check(ip1, t0 + 100);
      const ip1Blocked = limiter.check(ip1, t0 + 200);
      expect(ip1Blocked.success).toBe(false);

      // ip2 should still have full quota
      const ip2First = limiter.check(ip2, t0 + 300);
      expect(ip2First.success).toBe(true);
      expect(ip2First.remaining).toBe(1);
    });

    it('implements sliding window expiration correctly', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 10000 }); // 10s window
      const ip = '172.16.0.1';
      const t0 = 100000;

      // Use up limit at t0 and t0 + 2000
      limiter.check(ip, t0);
      limiter.check(ip, t0 + 2000);

      // At t0 + 5000, limit is exceeded
      expect(limiter.check(ip, t0 + 5000).success).toBe(false);

      // At t0 + 10001 (10.001s after first request), the first request expires
      const rAfterFirstExpiry = limiter.check(ip, t0 + 10001);
      expect(rAfterFirstExpiry.success).toBe(true);

      // But now we have [t0 + 2000, t0 + 10001], so limit is hit again
      expect(limiter.check(ip, t0 + 11000).success).toBe(false);

      // At t0 + 12001 (10.001s after second request), the second request expires
      const rAfterSecondExpiry = limiter.check(ip, t0 + 12001);
      expect(rAfterSecondExpiry.success).toBe(true);
    });

    it('supports resetting limits for a single IP or all IPs', () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 60000 });
      const ip1 = '1.1.1.1';
      const ip2 = '2.2.2.2';

      limiter.check(ip1);
      limiter.check(ip2);
      expect(limiter.check(ip1).success).toBe(false);
      expect(limiter.check(ip2).success).toBe(false);

      // Reset only ip1
      limiter.reset(ip1);
      expect(limiter.check(ip1).success).toBe(true);
      expect(limiter.check(ip2).success).toBe(false);

      // Reset all
      limiter.reset();
      expect(limiter.check(ip2).success).toBe(true);
      expect(limiter.size()).toBe(1);
    });

    it('queries remaining requests without consuming quota', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });
      const ip = '3.3.3.3';

      expect(limiter.getRemaining(ip)).toBe(5);
      limiter.check(ip);
      limiter.check(ip);
      expect(limiter.getRemaining(ip)).toBe(3);
      // Ensure getRemaining did not consume another token
      expect(limiter.getRemaining(ip)).toBe(3);
    });

    it('evicts least recently used entries when cache capacity is reached', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000, maxEntries: 3 });

      limiter.check('ip1');
      limiter.check('ip2');
      limiter.check('ip3');
      expect(limiter.size()).toBe(3);

      // Access ip1 again to make it most recently used (LRU order: ip2, ip3, ip1)
      limiter.check('ip1');

      // Adding ip4 should evict ip2 (oldest)
      limiter.check('ip4');
      expect(limiter.size()).toBe(3);

      // ip1, ip3, ip4 should be in cache; ip2 should have been evicted (reset to full quota)
      expect(limiter.getRemaining('ip2')).toBe(5);
      expect(limiter.getRemaining('ip1')).toBe(3); // was checked twice
    });

    it('handles empty, undefined, or whitespace IP strings gracefully', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 });

      const r1 = limiter.check('');
      expect(r1.success).toBe(true);

      const r2 = limiter.check('   ');
      expect(r2.success).toBe(true);

      const r3 = limiter.check('127.0.0.1');
      // All normalized to 127.0.0.1, so 3rd check hits limit
      expect(r3.success).toBe(false);
    });
  });

  describe('getClientIp (Header Extraction)', () => {
    it('extracts single IP from x-forwarded-for', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.195' }
      });
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('extracts first client IP from multi-hop x-forwarded-for with whitespace', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  203.0.113.195  , 70.41.3.18, 150.172.238.178' }
      });
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('strips port numbers from IPv4 addresses', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.50:8080' }
      });
      expect(getClientIp(req)).toBe('192.168.1.50');
    });

    it('handles standard IPv6 addresses', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '2001:db8:85a3::8a2e:370:7334' }
      });
      expect(getClientIp(req)).toBe('2001:db8:85a3::8a2e:370:7334');
    });

    it('handles bracketed IPv6 addresses with port', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '[2001:db8:85a3::8a2e:370:7334]:8080' }
      });
      expect(getClientIp(req)).toBe('2001:db8:85a3::8a2e:370:7334');
    });

    it('extracts IP from x-real-ip if x-forwarded-for is absent', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '198.51.100.22' }
      });
      expect(getClientIp(req)).toBe('198.51.100.22');
    });

    it('extracts IP from cf-connecting-ip (Cloudflare proxy)', () => {
      const req = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '198.51.100.44' }
      });
      expect(getClientIp(req)).toBe('198.51.100.44');
    });

    it('extracts IP from true-client-ip and x-client-ip', () => {
      const req1 = new Request('http://localhost', {
        headers: { 'true-client-ip': '198.51.100.55' }
      });
      expect(getClientIp(req1)).toBe('198.51.100.55');

      const req2 = new Request('http://localhost', {
        headers: { 'x-client-ip': '198.51.100.66' }
      });
      expect(getClientIp(req2)).toBe('198.51.100.66');
    });

    it('prioritizes x-forwarded-for over x-real-ip and cf-connecting-ip', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '203.0.113.2',
          'cf-connecting-ip': '203.0.113.3'
        }
      });
      expect(getClientIp(req)).toBe('203.0.113.1');
    });

    it('extracts direct ip property if present (NextRequest / Node socket)', () => {
      const req = { ip: '10.20.30.40', headers: new Headers() };
      expect(getClientIp(req as any)).toBe('10.20.30.40');
    });

    it('falls back to 127.0.0.1 when no IP headers are provided', () => {
      const req = new Request('http://localhost', { headers: {} });
      expect(getClientIp(req)).toBe('127.0.0.1');
    });

    it('handles null, undefined, or empty request objects safely', () => {
      expect(getClientIp(null)).toBe('127.0.0.1');
      expect(getClientIp(undefined)).toBe('127.0.0.1');
      expect(getClientIp({} as any)).toBe('127.0.0.1');
    });
  });

  describe('Chat API IP Rate Limiting (Integration Tests)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      chatRateLimiter.reset();
      (auth as any).mockResolvedValue({ user: { role: 'admin' } });
      (routeQuery as any).mockResolvedValue({
        action: 'answer_directly',
        reasoning: 'general greeting',
        response_text: 'Hello from Anchor!'
      });
    });

    const createChatRequest = (ip: string, question: string = 'Hello Anchor') => {
      return new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({ question }),
      });
    };

    it('allows requests under the rate limit to proceed and invoke Gemini', async () => {
      const clientIp = '203.0.113.100';

      // Send 5 successful requests
      for (let i = 0; i < 5; i++) {
        const res = await POST(createChatRequest(clientIp, `Question ${i + 1}`));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.answer).toBe('Hello from Anchor!');
      }

      // Gemini routeQuery should have been invoked 5 times
      expect(routeQuery).toHaveBeenCalledTimes(5);
    });

    it('rejects requests over limit with 429 Too Many Requests WITHOUT calling Gemini API', async () => {
      const clientIp = '203.0.113.101';
      const MAX_REQUESTS = 10; // Default limit per hour

      // Consume entire quota (10 requests)
      for (let i = 0; i < MAX_REQUESTS; i++) {
        const res = await POST(createChatRequest(clientIp, `Question ${i + 1}`));
        expect(res.status).toBe(200);
      }
      expect(routeQuery).toHaveBeenCalledTimes(MAX_REQUESTS);

      // Attempt 11th request (exceeds limit)
      const blockedRes = await POST(createChatRequest(clientIp, 'Should be blocked'));

      // 1. Status must be 429
      expect(blockedRes.status).toBe(429);

      // 2. Body must contain friendly message and RATE_LIMIT_EXCEEDED code
      const body = await blockedRes.json();
      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.error).toContain('rate limit exceeded');

      // 3. Response headers must include Retry-After and rate limit diagnostics
      expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
      expect(Number(blockedRes.headers.get('Retry-After'))).toBeGreaterThan(0);
      expect(blockedRes.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(blockedRes.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(blockedRes.headers.get('X-RateLimit-Reset')).toBeTruthy();

      // 4. CRITICAL: Gemini API (routeQuery and generateAnswer) MUST NOT be called on blocked request
      expect(routeQuery).toHaveBeenCalledTimes(MAX_REQUESTS);
      expect(generateAnswer).not.toHaveBeenCalled();
      expect(searchDocuments).not.toHaveBeenCalled();
    });

    it('allows another IP address to proceed even when one IP is rate limited', async () => {
      const blockedIp = '203.0.113.200';
      const freshIp = '203.0.113.201';

      // Exhaust blockedIp's quota
      for (let i = 0; i < 10; i++) {
        await POST(createChatRequest(blockedIp, `Question ${i}`));
      }

      // Verify blockedIp is rejected
      const blockedRes = await POST(createChatRequest(blockedIp, 'Blocked query'));
      expect(blockedRes.status).toBe(429);

      // Verify freshIp succeeds
      const freshRes = await POST(createChatRequest(freshIp, 'Fresh query'));
      expect(freshRes.status).toBe(200);
      const freshData = await freshRes.json();
      expect(freshData.answer).toBe('Hello from Anchor!');
    });

    it('correctly tracks client IP across various reverse proxy header configurations in API route', async () => {
      // 1. Multi-hop x-forwarded-for
      const multiHopReq = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '198.51.100.99, 10.0.0.1, 172.16.0.1',
        },
        body: JSON.stringify({ question: 'Test multi-hop' }),
      });
      const res1 = await POST(multiHopReq);
      expect(res1.status).toBe(200);
      expect(chatRateLimiter.getRemaining('198.51.100.99')).toBe(9);

      // 2. x-real-ip
      const realIpReq = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '198.51.100.88',
        },
        body: JSON.stringify({ question: 'Test real IP' }),
      });
      const res2 = await POST(realIpReq);
      expect(res2.status).toBe(200);
      expect(chatRateLimiter.getRemaining('198.51.100.88')).toBe(9);

      // 3. cf-connecting-ip
      const cloudflareReq = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '198.51.100.77',
        },
        body: JSON.stringify({ question: 'Test cloudflare' }),
      });
      const res3 = await POST(cloudflareReq);
      expect(res3.status).toBe(200);
      expect(chatRateLimiter.getRemaining('198.51.100.77')).toBe(9);
    });

    it('allows requests again once the rate limiter is reset', async () => {
      const clientIp = '203.0.113.250';

      // Exhaust quota
      for (let i = 0; i < 10; i++) {
        await POST(createChatRequest(clientIp, `Question ${i}`));
      }
      expect((await POST(createChatRequest(clientIp, 'Blocked'))).status).toBe(429);

      // Reset IP rate limit
      chatRateLimiter.reset(clientIp);

      // Request should succeed again
      const retryRes = await POST(createChatRequest(clientIp, 'Allowed after reset'));
      expect(retryRes.status).toBe(200);
    });
  });
});
