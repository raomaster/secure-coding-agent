# Security Review Cache — Design

> Planned for v0.2.0. This document describes the design before implementation.

---

## Problem

Every `/review` call sends **all changed files** to Gemini 3.1 Pro, even files that haven't changed since the last review.

This wastes:
- Gemini token quota (Google One has limits)
- Time (review latency per file)
- Money (if ever moving to API billing)

---

## Solution

A per-project cache in `.multi-agent-cache/security-cache.json` tracks the review state of every file:

- **Key**: file path (relative to project root)
- **Value**: SHA-256 hash of file content + last review results + timestamp + reviewer used

When `/review` runs:
1. Compute hash of each candidate file
2. Compare against cache
3. If hash matches and entry is fresh → **skip** (use cached findings)
4. Send only **changed/new/stale** files to the reviewer
5. Update cache after review completes

---

## Cache Schema

```json
{
  "version": "1",
  "config": {
    "ttl_hours": 72,
    "reviewer": "gemini/pro"
  },
  "entries": {
    "src/auth.py": {
      "hash": "sha256:a3f4b2c...",
      "size_bytes": 4821,
      "reviewed_at": "2026-03-10T14:22:00Z",
      "reviewer_cli": "gemini",
      "reviewer_model": "pro",
      "findings_count": 2,
      "findings": [
        {
          "severity": "HIGH",
          "cwe": "CWE-798",
          "line": 42,
          "description": "Hardcoded API key",
          "fixed": false
        }
      ],
      "status": "findings",
      "false_positives": []
    },
    "src/utils.py": {
      "hash": "sha256:b7c9d1e...",
      "size_bytes": 1204,
      "reviewed_at": "2026-03-10T14:22:05Z",
      "reviewer_cli": "gemini",
      "reviewer_model": "pro",
      "findings_count": 0,
      "findings": [],
      "status": "clean",
      "false_positives": []
    }
  }
}
```

### Status values

| Status | Meaning |
|--------|---------|
| `clean` | Reviewed, no findings |
| `findings` | Reviewed, has open findings |
| `fixed` | Had findings, all marked as fixed and verified |
| `stale` | Hash changed since last review — needs re-review |
| `skipped` | File explicitly excluded from review |

---

## `/review` Flow with Cache (v0.2.0)

```
/review [files]
  │
  ├─ 1. Identify candidate files (changed since last git commit, or explicit list)
  │
  ├─ 2. For each file:
  │       compute SHA-256 hash
  │       check cache entry
  │       if hash matches AND entry is fresh (< ttl_hours) AND status != "stale"
  │           → SKIP (use cached findings)
  │       else
  │           → ADD to review queue
  │
  ├─ 3. If review queue is empty:
  │       report "All files already reviewed — no new findings"
  │       show cache summary
  │
  ├─ 4. Send review queue to reviewer (Gemini Pro)
  │       cat [review_queue_files] | gemini -m pro --yolo -p "..."
  │
  ├─ 5. Parse findings
  │       update cache entries for reviewed files
  │
  └─ 6. Report:
          [CACHED] src/utils.py — clean (reviewed 2h ago)
          [NEW]    src/auth.py — 1 HIGH, 1 MEDIUM
          [CACHED] src/config.py — clean (reviewed 1h ago)
```

---

## `/cache-status` Output

```
Security Review Cache — 2026-03-10

File                          Status      Findings   Last Reviewed      Age
──────────────────────────────────────────────────────────────────────────────
src/auth.py                   FINDINGS    2 (1H,1M)  2h ago             fresh
src/utils.py                  CLEAN       0          2h ago             fresh
src/config.py                 CLEAN       0          1h ago             fresh
src/payment.py                STALE       unknown    3 days ago         stale → needs re-review
src/new_feature.py            UNREVIEWED  unknown    never              new

Summary: 2 clean, 1 with findings, 1 stale, 1 unreviewed
Run /review to update stale and unreviewed files.
```

---

## False Positive Tracking

When a finding is marked as false positive, it's stored in the cache:

```json
"false_positives": [
  {
    "cwe": "CWE-798",
    "line": 42,
    "reason": "This is a placeholder value used only in test fixtures",
    "marked_by": "user",
    "marked_at": "2026-03-10T15:00:00Z"
  }
]
```

In v1.0.0, the cache will suppress these findings on future re-reviews of the same file.

---

## Cache Integration in `.multi-agent.json`

```json
{
  "cache": {
    "enabled": true,
    "ttl_hours": 72,
    "dir": ".multi-agent-cache",
    "exclude_patterns": [
      "*.test.*",
      "*.spec.*",
      "__tests__/**",
      "node_modules/**"
    ]
  }
}
```

---

## File to Add to `.gitignore`

```gitignore
# Multi-agent cache (local only, regeneratable)
.multi-agent-cache/
.multi-agent-checkpoints/
```

Cache entries are local to each developer's machine — not committed to git. This is intentional: review results may differ between tool versions, and the cache is cheap to regenerate.

---

## Implementation Plan (v0.2.0)

1. `src/cache.ts` — cache read/write/invalidation logic
2. Update `src/installer.ts` — add `.multi-agent-cache/` to `.gitignore` during install
3. Update `.claude/commands/review.md` — add cache check step
4. New `.claude/commands/cache-status.md`
5. New `.claude/commands/cache-clear.md`
6. Update `.multi-agent.json` template — add `cache` config block
