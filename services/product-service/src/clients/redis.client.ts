export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * Redis Client Preparation Wrapper
 * Ready for connection when ioredis / redis is introduced into Docker infrastructure.
 */
export class RedisClient implements CacheClient {
  private inMemoryCache: Map<string, { value: string; expiresAt?: number }> = new Map();
  private isConnected: boolean = false;

  constructor() {
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = process.env.REDIS_PORT || "6379";
    console.log(`🔌 [REDIS PREP] Redis client initialized (target: ${redisHost}:${redisPort})`);
  }

  async get(key: string): Promise<string | null> {
    const cached = this.inMemoryCache.get(key);
    if (!cached) return null;
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      this.inMemoryCache.delete(key);
      return null;
    }
    return cached.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.inMemoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.inMemoryCache.delete(key);
  }
}

export const redisClient = new RedisClient();
