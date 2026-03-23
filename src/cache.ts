// src/cache.ts — Security review cache types (future design placeholder)
// See docs/cache-design.md for full design.

export type CacheStatus = "clean" | "findings" | "fixed" | "stale" | "skipped";

export interface CacheFinding {
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    cwe: string;                 // e.g. "CWE-798"
    line: number;
    description: string;
    fixed: boolean;
}

export interface FalsePositive {
    cwe: string;
    line: number;
    reason: string;
    marked_at: string;          // ISO 8601
}

export interface CacheEntry {
    hash: string;               // "sha256:hex..."
    size_bytes: number;
    reviewed_at: string;        // ISO 8601
    reviewer_cli: string;       // e.g. "gemini"
    reviewer_model: string;     // e.g. "pro"
    findings_count: number;
    findings: CacheFinding[];
    status: CacheStatus;
    false_positives: FalsePositive[];
}

export interface CacheConfig {
    enabled: boolean;
    ttl_hours: number;          // default: 72
    dir: string;                // default: ".multi-agent-cache"
    exclude_patterns: string[]; // glob patterns to skip
}

export interface SecurityCache {
    version: "1";
    config: {
        ttl_hours: number;
        reviewer_cli: string;
        reviewer_model: string;
    };
    entries: Record<string, CacheEntry>;  // key: relative file path
}

// ─── Planned public API (future release) ──────────────────────────────

/**
 * Load cache from disk. Returns empty cache if not found.
 * @param cacheDir - path to cache directory (default: ".multi-agent-cache")
 */
export type LoadCache = (cacheDir?: string) => SecurityCache;

/**
 * Check if a file's review is still valid (hash matches + not expired).
 */
export type IsCacheHit = (
    cache: SecurityCache,
    filePath: string,
    currentHash: string,
    config: CacheConfig
) => boolean;

/**
 * Update cache entry after a review completes.
 */
export type UpdateEntry = (
    cache: SecurityCache,
    filePath: string,
    hash: string,
    sizeBytes: number,
    findings: CacheFinding[],
    reviewerCli: string,
    reviewerModel: string
) => SecurityCache;

/**
 * Save cache to disk (atomic write via temp file + rename).
 */
export type SaveCache = (cache: SecurityCache, cacheDir?: string) => void;

/**
 * Invalidate entries matching a glob pattern or all entries.
 */
export type ClearCache = (
    cache: SecurityCache,
    pattern?: string    // undefined = clear all
) => SecurityCache;

/**
 * Get summary stats for /cache-status skill.
 */
export interface CacheSummary {
    total: number;
    clean: number;
    findings: number;
    stale: number;
    unreviewed: number;
    hit_rate_percent: number;   // last session stat
}

export type GetCacheSummary = (cache: SecurityCache, allProjectFiles: string[]) => CacheSummary;
