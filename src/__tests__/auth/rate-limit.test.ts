import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  _resetRateLimitMap,
  RATE_LIMITS,
} from "@/app/lib/rate-limit";

beforeEach(() => {
  _resetRateLimitMap();
});

describe("checkRateLimit", () => {
  it("should allow requests within the limit", () => {
    const config = { maxRequests: 3, windowSeconds: 60 };
    const r1 = checkRateLimit("test-ip", config);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit("test-ip", config);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit("test-ip", config);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("should block requests exceeding the limit", () => {
    const config = { maxRequests: 2, windowSeconds: 60 };
    checkRateLimit("block-ip", config);
    checkRateLimit("block-ip", config);

    const r3 = checkRateLimit("block-ip", config);
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should track different identifiers separately", () => {
    const config = { maxRequests: 1, windowSeconds: 60 };
    const r1 = checkRateLimit("ip-a", config);
    expect(r1.success).toBe(true);

    const r2 = checkRateLimit("ip-b", config);
    expect(r2.success).toBe(true);

    const r3 = checkRateLimit("ip-a", config);
    expect(r3.success).toBe(false);
  });

  it("should reset after window expires", () => {
    const config = { maxRequests: 1, windowSeconds: 0 }; // 0-second window expires immediately
    const r1 = checkRateLimit("expire-ip", config);
    expect(r1.success).toBe(true);

    // Since window is 0 seconds, the next request should get a fresh window
    const r2 = checkRateLimit("expire-ip", config);
    expect(r2.success).toBe(true);
  });
});

describe("RATE_LIMITS presets", () => {
  it("should have correct AUTH_REGISTER limits", () => {
    expect(RATE_LIMITS.AUTH_REGISTER.maxRequests).toBe(10);
    expect(RATE_LIMITS.AUTH_REGISTER.windowSeconds).toBe(15 * 60);
  });

  it("should have correct AUTH_LOGIN limits", () => {
    expect(RATE_LIMITS.AUTH_LOGIN.maxRequests).toBe(5);
    expect(RATE_LIMITS.AUTH_LOGIN.windowSeconds).toBe(15 * 60);
  });

  it("should have correct GENERAL_API limits", () => {
    expect(RATE_LIMITS.GENERAL_API.maxRequests).toBe(100);
    expect(RATE_LIMITS.GENERAL_API.windowSeconds).toBe(60);
  });

  it("should have correct AI_ANALYSIS limits", () => {
    expect(RATE_LIMITS.AI_ANALYSIS.maxRequests).toBe(10);
    expect(RATE_LIMITS.AI_ANALYSIS.windowSeconds).toBe(60 * 60);
  });
});

describe("getClientIp", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const mockHeaders = new Map([["x-forwarded-for", "192.168.1.1, 10.0.0.1"]]);
    const request = { headers: { get: (key: string) => mockHeaders.get(key) || null } } as unknown as Request;
    expect(getClientIp(request)).toBe("192.168.1.1");
  });

  it("should extract IP from x-real-ip header", () => {
    const mockHeaders = new Map([["x-real-ip", "10.0.0.1"]]);
    const request = { headers: { get: (key: string) => mockHeaders.get(key) || null } } as unknown as Request;
    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("should return 'unknown' when no IP headers present", () => {
    const request = { headers: { get: () => null } } as unknown as Request;
    expect(getClientIp(request)).toBe("unknown");
  });
});
