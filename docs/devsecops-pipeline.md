# Security-First AI Development Workflow

Longer-form workflow vision for Secure Coding Agent. This document describes how the project can evolve from the current stable core into a richer review and delivery system.

---

## Philosophy

> Generate code → verify quality → scan for vulnerabilities → AI-fix issues → validate → report.

Each stage catches a different class of problem. Running them in sequence means AI fixes go in **before** the final security review, so the reviewer sees clean code — not code with known linter errors still in it.

The key insight: **use cheap/fast tools first** (linters, automated scanners), **expensive AI last** (Gemini Pro review). This maximizes the value of each token spent.

---

## Current Pipeline (v0.1.x)

```
/full-cycle:

  ┌─────────────────────────────────────────────────┐
  │  checkpoint (git stash)                         │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /plan — Sonnet 4.6                             │
  │  Research codebase, ask clarifying questions    │
  │  Create atomic task breakdown                   │
  └──────────────────┬──────────────────────────────┘
                     │ [user confirms plan]
  ┌──────────────────▼──────────────────────────────┐
  │  /code — Haiku 4.5 (parallel workers)           │
  │  Implement tasks with full context upfront      │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /review — Gemini 3.1 Pro                       │
  │  Security: OWASP ASVS 5.0, CWE Top 25          │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /report — Gemini Flash                         │
  │  Executive summary, metrics, roadmap            │
  └─────────────────────────────────────────────────┘
```

---

## Target Pipeline (v0.3.0)

```
/devsecops-cycle:

  ┌─────────────────────────────────────────────────┐
  │  checkpoint (git stash)                    [1]  │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /plan — Sonnet 4.6                        [2]  │
  │  Research + task breakdown                      │
  └──────────────────┬──────────────────────────────┘
                     │ [user confirms plan]
  ┌──────────────────▼──────────────────────────────┐
  │  /code — Haiku 4.5 (parallel workers)      [3]  │
  │  Implement tasks with full context              │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /lint — ESLint / Ruff / golangci-lint     [4]  │
  │  Code quality: style, types, best practices     │
  │  Fast, free, no AI tokens                       │
  └──────────────────┬──────────────────────────────┘
                     │ (if findings)
  ┌──────────────────▼──────────────────────────────┐
  │  /lint-fix — Haiku 4.5                     [5]  │
  │  Fix linter issues with AI                      │
  │  Cheap (Haiku), targeted, fast                  │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /scan-all — parallel (no AI)              [6]  │  ◄─ parallel
  │  ├── Semgrep (SAST, CWE-mapped)                 │
  │  ├── Gitleaks (secrets, CWE-798)                │
  │  └── Trivy (CVEs in dependencies)               │
  └──────────────────┬──────────────────────────────┘
                     │ (if findings)
  ┌──────────────────▼──────────────────────────────┐
  │  /fix-all — Haiku 4.5                      [7]  │
  │  AI-generated fixes for all scanner findings    │
  │  Prioritized: CRITICAL → HIGH → MEDIUM          │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /review — Gemini 3.1 Pro (with cache)     [8]  │
  │  Final security validation on clean code        │
  │  Cache skips unchanged files                    │
  └──────────────────┬──────────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────────┐
  │  /report — Gemini Flash                    [9]  │
  │  Consolidated report: lint + scan + review      │
  └─────────────────────────────────────────────────┘
```

---

## Stage Details

### Stage 1 — Checkpoint
Safety net. `git stash push -m "mca-checkpoint: devsecops-TIMESTAMP"`.
If any stage fails badly → `/rollback` to pre-cycle state.

### Stage 2 — Plan (Sonnet)
- Explore codebase conventions, types, existing tests
- Break feature into atomic tasks with explicit dependencies
- Identify security surface changes (new trust boundaries, external inputs)
- Suggest `/threat-model` for significant architectural changes

### Stage 3 — Code (Haiku workers)
- Each worker gets full context upfront: conventions, types, task spec, definition of done
- Non-overlapping tasks run in parallel (multiple Bash calls in same message)
- Workers have clean context windows — don't accumulate session state

### Stage 4 — Lint
- Auto-detect language from file extensions
- Run appropriate linter(s) with project config file if present
- Output: structured findings per file and line
- Fast — no AI, no external APIs, no token cost

### Stage 5 — Lint-Fix (Haiku)
- Only runs if Stage 4 found issues
- Delegates each linter finding to Haiku with precise context
- Cheaper than Sonnet, appropriate for mechanical fixes
- Re-runs linter to verify fixes worked

### Stage 6 — Scan-All (parallel, no AI)
- Semgrep, Gitleaks, Trivy run in parallel (independent of each other)
- Findings merged into `findings-YYYYMMDD.json`
- Deduplicated by file + line + rule
- No AI tokens at this stage

### Stage 7 — Fix-All (Haiku)
- Only runs if Stage 6 found CRITICAL or HIGH issues
- Single Haiku invocation per finding with precise file + line context
- Verifies fix by re-running the specific scanner rule
- Documents unfixable issues (missing library update, needs arch change)

### Stage 8 — Review (Gemini Pro + cache)
- Only sends files that changed since last cached review
- Validates Stage 7 fixes are correct
- Catches security issues that scanners missed (logic flaws, auth bypass, etc.)
- Uses full 2M token context — can analyze multiple related files together

### Stage 9 — Report (Gemini Flash)
- Consolidates findings from: lint + scanners + AI review
- Status badge: 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 CLEAN
- Top 3 actionable items
- Estimated remediation effort
- Saves to `security-report-YYYYMMDD.md`

---

## Cost Optimization Strategy

| Stage | Tool | AI Cost | Notes |
|-------|------|---------|-------|
| Checkpoint | git | Free | Always |
| Plan | Sonnet | Low | Short prompt + codebase exploration |
| Code | Haiku | Very Low | Per worker, clean context |
| Lint | ESLint/Ruff | Free | No AI |
| Lint-Fix | Haiku | Very Low | Targeted, small context |
| Scan-All | Semgrep/Gitleaks/Trivy | Free | No AI |
| Fix-All | Haiku | Very Low | Only runs on CRITICAL/HIGH |
| Review | Gemini Pro | Low* | Cache skips unchanged files |
| Report | Gemini Flash | Very Low | Small prompt, fast model |

*Gemini token caching means `GEMINI.md` + `AGENT_RULES.md` are cached after first use — only new/changed content costs tokens.

**Total**: The expensive models (Sonnet, Gemini Pro) are used sparingly. Haiku handles the bulk of the work.

---

## Comparison with Traditional DevSecOps

| Traditional | secure-coding-agent |
|------------|-------------------|
| Dev writes code | Haiku writes code from Sonnet's plan |
| CI runs linter | `/lint` runs linter, Haiku auto-fixes |
| CI runs SAST | `/scan-all` runs SAST + secrets + deps |
| Dev manually fixes findings | `/fix-all` generates AI fixes |
| Security engineer reviews PR | Gemini Pro reviews with 2M context |
| Security writes report | Gemini Flash generates report in seconds |
| Dev rolls back broken branch | `/rollback` restores to checkpoint |

The human stays in the loop for: plan confirmation, rollback decisions, and final merge approval.
