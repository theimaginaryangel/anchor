/**
 * In-Memory IP-Based Rate Limiter for Anchor API Endpoints
 *
 * Implements a sliding-window rate limiter using an in-memory Map with LRU eviction
 * to prevent memory leaks while defending against Gemini API quota exhaustion.
 */

export interface RateLimiterOptions {
  /** Maximum number of requests allowed in the time window */
  maxRequests?: number;
  /** Duration of the sliding time window in milliseconds (default: 1 hour) */
  windowMs?: number;
  /** Maximum number of unique IP entries to keep in cache before LRU eviction */
  maxEntries?: number;
}

export interface RateLimitResult {
  /** Whether the request is permitted */
  success: boolean;
  /** Total maximum requests permitted in the window */
  limit: number;
  /** Remaining number of requests permitted in the current window */
  remaining: number;
  /** Unix timestamp in ms when the earliest request in the window expires */
  resetTime: number;
  /** Suggested number of seconds to wait before retrying (0 if permitted) */
  retryAfterSeconds: number;
}

/**
 * Extracts and cleans the client IP address from request headers or socket info.
 * Supports reverse proxies (x-forwarded-for, x-real-ip, cf-connecting-ip, etc.).
 */
export function getClientIp(
  req?: Request | { headers?: Headers | Record<string, string | string[] | undefined>; ip?: string } | null
): string {
  if (!req) return '127.0.0.1';

  // Check direct ip property if present (e.g., NextRequest or custom server)
  if ('ip' in req && typeof req.ip === 'string' && req.ip.trim()) {
    return cleanIp(req.ip.trim());
  }

  const getHeaderValue = (headerName: string): string | null => {
    if (!req || !('headers' in req) || !req.headers) return null;
    const headers = req.headers;

    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(headerName);
    }

    if (typeof headers === 'object') {
      const record = headers as Record<string, string | string[] | undefined>;
      const val = record[headerName] || record[headerName.toLowerCase()];
      if (Array.isArray(val)) return val[0] || null;
      if (typeof val === 'string') return val;
    }

    return null;
  };

  const candidateHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip',
    'x-client-ip',
    'fastly-client-ip',
  ];

  for (const name of candidateHeaders) {
    const rawVal = getHeaderValue(name);
    if (rawVal && typeof rawVal === 'string') {
      // In x-forwarded-for, the client IP is the first entry before any proxies
      const firstIp = rawVal.split(',')[0].trim();
      if (firstIp) {
        return cleanIp(firstIp);
      }
    }
  }

  return '127.0.0.1';
}

/**
 * Normalizes IP address by stripping port numbers (IPv4 / IPv6 bracket notation) and whitespace.
 */
function cleanIp(ip: string): string {
  let cleaned = ip.trim();

  // Strip IPv6 brackets and optional port: e.g. [2001:db8::1]:8080 or [2001:db8::1]
  if (cleaned.startsWith('[') && cleaned.includes(']')) {
    const match = cleaned.match(/^\[([a-fA-F0-9:]+)\](?::\d+)?$/);
    if (match) return match[1];
  }

  // Strip port for IPv4: e.g. 192.168.1.50:3000
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(cleaned)) {
    cleaned = cleaned.split(':')[0];
  }

  return cleaned;
}

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private maxEntries: number;
  private cache: Map<string, number[]>;

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 10;
    this.windowMs = options.windowMs ?? 60 * 60 * 1000; // 1 hour default
    this.maxEntries = options.maxEntries ?? 10000;
    this.cache = new Map();
  }

  /**
   * Check if a request from the given IP is allowed.
   * If allowed, records the request timestamp and returns remaining quota.
   * If rate limited, returns retry-after and reset time without updating timestamps.
   */
  public check(ip: string, now: number = Date.now()): RateLimitResult {
    const normalizedIp = ip?.trim() || '127.0.0.1';
    let timestamps = this.cache.get(normalizedIp);

    if (timestamps) {
      const cutoff = now - this.windowMs;
      timestamps = timestamps.filter(t => t > cutoff);
    } else {
      timestamps = [];
    }

    // Refresh LRU order by deleting and re-inserting
    this.cache.delete(normalizedIp);

    if (timestamps.length >= this.maxRequests) {
      // Re-insert valid timestamps to keep entry in LRU order
      this.cache.set(normalizedIp, timestamps);

      const oldestInWindow = timestamps[0];
      const resetTime = oldestInWindow + this.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime,
        retryAfterSeconds,
      };
    }

    // Allowed: record current timestamp
    timestamps.push(now);
    this.cache.set(normalizedIp, timestamps);

    // Evict least recently used entries if cache exceeds max capacity
    if (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const resetTime = timestamps[0] + this.windowMs;

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - timestamps.length,
      resetTime,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Query the remaining requests for an IP without consuming a request token.
   */
  public getRemaining(ip: string, now: number = Date.now()): number {
    const normalizedIp = ip?.trim() || '127.0.0.1';
    const timestamps = this.cache.get(normalizedIp);
    if (!timestamps) return this.maxRequests;
    const cutoff = now - this.windowMs;
    const valid = timestamps.filter(t => t > cutoff);
    return Math.max(0, this.maxRequests - valid.length);
  }

  /**
   * Reset rate limit counts for a specific IP or all IPs.
   */
  public reset(ip?: string): void {
    if (ip) {
      this.cache.delete(ip.trim());
    } else {
      this.cache.clear();
    }
  }

  /**
   * Returns current count of tracked IPs in the cache.
   */
  public size(): number {
    return this.cache.size;
  }
}

// Default singleton instance configured for chat API
// 10 requests per hour per IP by default (configurable via environment variables)
const DEFAULT_CHAT_MAX = Number(process.env.CHAT_RATE_LIMIT_MAX) || 10;
const DEFAULT_CHAT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;

export const chatRateLimiter = new RateLimiter({
  maxRequests: DEFAULT_CHAT_MAX,
  windowMs: DEFAULT_CHAT_WINDOW_MS,
  maxEntries: 10000,
});

const DEFAULT_UPLOAD_MAX = Number(process.env.UPLOAD_RATE_LIMIT_MAX) || 5;
const DEFAULT_UPLOAD_WINDOW_MS = Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;

export const uploadRateLimiter = new RateLimiter({
  maxRequests: DEFAULT_UPLOAD_MAX,
  windowMs: DEFAULT_UPLOAD_WINDOW_MS,
  maxEntries: 5000,
});

