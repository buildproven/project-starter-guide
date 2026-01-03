/**
 * DNS Caching Layer
 *
 * Implements DNS result caching to reduce latency for repeated requests.
 * Typical DNS lookups add 50-200ms latency per request.
 *
 * Features:
 * - In-memory cache with TTL
 * - Automatic cache invalidation
 * - Thread-safe operations
 * - Configurable cache size
 *
 * Performance Impact:
 * - Eliminates 50-200ms DNS lookup latency on cache hits
 * - Reduces load on DNS servers
 * - Improves overall request throughput
 */

import dns from 'dns'
import { promisify } from 'util'

const dnsLookup = promisify(dns.lookup)

interface DNSCacheEntry {
  address: string
  family: number
  timestamp: number
  ttl: number
}

class DNSCache {
  private cache: Map<string, DNSCacheEntry>
  private readonly defaultTTL: number
  private readonly maxSize: number

  constructor(defaultTTL = 300000, maxSize = 1000) {
    // Default TTL: 5 minutes
    this.cache = new Map()
    this.defaultTTL = defaultTTL
    this.maxSize = maxSize
  }

  /**
   * Lookup a hostname with caching
   */
  async lookup(hostname: string): Promise<{ address: string; family: number }> {
    const cached = this.get(hostname)
    if (cached) {
      return { address: cached.address, family: cached.family }
    }

    // Perform DNS lookup
    const result = await dnsLookup(hostname)

    // Cache the result
    this.set(hostname, result.address, result.family)

    return result
  }

  /**
   * Get cached DNS entry if not expired
   */
  private get(hostname: string): DNSCacheEntry | null {
    const entry = this.cache.get(hostname)
    if (!entry) {
      return null
    }

    // Check if entry is expired
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(hostname)
      return null
    }

    return entry
  }

  /**
   * Cache a DNS lookup result
   */
  private set(hostname: string, address: string, family: number): void {
    // Implement simple LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(hostname, {
      address,
      family,
      timestamp: Date.now(),
      ttl: this.defaultTTL,
    })
  }

  /**
   * Manually invalidate a hostname
   */
  invalidate(hostname: string): void {
    this.cache.delete(hostname)
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }
}

// Export singleton instance
export const dnsCache = new DNSCache()
