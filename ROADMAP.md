# Roadmap

Strategic direction for `secure-coding-agent`. Items within a version are ordered by priority.

> **Principle**: Each version delivers a complete, usable improvement — no half-finished features.

---

## v0.1.x — Stability (current)

Patch releases to fix issues found in v0.1.0 POC.

- [ ] Fix `install.sh` edge cases (missing git, non-standard Node.js paths)
- [ ] Add `--dry-run` flag to preview what will be installed without writing files
- [ ] Add `--update` flag to update an existing installation without re-running agent-security-policies
- [ ] Validate `.multi-agent.json` schema on load (warn on unknown CLIs or missing fields)
- [ ] Test matrix: macOS / Linux / Windows (WSL2)

---

## v0.2.0 — Cache + Linters

**Theme**: Stop re-doing work. Know which files have already been reviewed. Add code quality layer before security.

### Security Review Cache

Problem: Every `/review` call sends all changed files to Gemini, even files that haven't changed since the last review.

Solution: `.multi-agent-cache/security-cache.json` tracks per-file review state.

```json
{
  "version": "1",
  "entries": {
    "src/auth.py": {
      "hash": "sha256:a3f...",
      "reviewed_at": "2026-03-10T14:22:00Z",
      "reviewer": "gemini/pro",
      "findings": [{ "severity": "HIGH", "cwe": "CWE-798", "line": 42 }],
      "status": "findings"
    },
    "src/utils.py": {
      "hash": "sha256:b7c...",
      "reviewed_at": "2026-03-10T14:22:05Z",
      "reviewer": "gemini/pro",
      "findings": [],
      "status": "clean"
    }
  }
}
```

- `/review` computes SHA-256 of each candidate file
- If hash matches cache entry and entry is fresh (< `cache_ttl_hours`, default 72h) → skip
- Only sends changed/new files to the reviewer
- After review, updates cache with new findings
- `/cache-status` shows: which files are clean, which have findings, which are stale

New skills:
- `/cache-status` — show security review cache state per file
- `/cache-clear` — invalidate cache (force full re-review)

New config in `.multi-agent.json`:
```json
{
  "cache": {
    "enabled": true,
    "ttl_hours": 72,
    "dir": ".multi-agent-cache"
  }
}
```

### Linter Skills

Add code quality layer **before** security scans in the pipeline. Catch style/quality issues cheaply before spending AI tokens on security analysis.

New skills:
- `/lint` — runs the appropriate linter for the detected language
- `/lint-fix` — AI-assisted fix of linter findings (delegates to Haiku)

Supported linters (auto-detected by file extension):

| Language | Tool | Config file |
|----------|------|-------------|
| JavaScript / TypeScript | ESLint | `.eslintrc.*`, `eslint.config.*` |
| Python | Ruff (primary), Pylint (fallback) | `pyproject.toml`, `.ruff.toml` |
| Go | golangci-lint | `.golangci.yml` |
| Rust | Clippy | `Cargo.toml` |
| Ruby | RuboCop | `.rubocop.yml` |
| Shell | ShellCheck | — |
| Markdown / Docs | markdownlint | `.markdownlint.json` |

Pipeline update with linters:

```
/full-cycle v0.2.0:
  checkpoint → plan → code (Haiku) → lint → lint-fix (Haiku) → sast-scan → review (Gemini) → report
```

### New Commands

| Skill | Description |
|-------|-------------|
| `/lint` | Run linter for detected language, output findings |
| `/lint-fix` | Delegate linter fixes to Haiku coder |
| `/cache-status` | Show per-file security review cache state |
| `/cache-clear` | Clear stale or all cache entries |

---

## v0.3.0 — Full DevSecOps Pipeline

**Theme**: Complete automated pipeline from code generation to production-ready output.

### Full Pipeline

```
/devsecops-cycle:

  1. checkpoint          → git stash (safety net)
  2. plan               → Sonnet: analyze + task breakdown
  3. code               → Haiku: parallel implementation
  4. lint               → ESLint/Ruff/etc: code quality
  5. lint-fix           → Haiku: fix linter issues
  6. sast-scan          → Semgrep: static security analysis
  7. secrets-scan       → Gitleaks: credential detection
  8. dependency-scan    → Trivy: CVE in dependencies
  9. fix-findings       → Haiku: AI-generated security fixes
  10. review            → Gemini Pro: final security validation
  11. report            → Gemini Flash: executive summary
```

### Parallel Scans

Run security scans in parallel (they don't depend on each other):

```bash
# v0.3.0: parallel execution of independent scans
semgrep scan ... &
gitleaks detect ... &
trivy fs ... &
wait  # then merge findings → AI fix → review
```

### Consolidated Findings

- Merge output from all scanners into a single `findings-YYYYMMDD.json`
- Deduplicate by file + line + CWE
- Single AI fix pass covering all finding types
- One consolidated executive report

### New Skills

| Skill | Description |
|-------|-------------|
| `/devsecops-cycle` | Full automated pipeline (all stages) |
| `/scan-all` | Run all security scans in parallel, merge findings |
| `/fix-all` | AI fix for all consolidated findings |

---

## v0.4.0 — MCP Integration

**Theme**: Shared context and tools between agents via Model Context Protocol.

### Security Scan MCP Server

An MCP server that wraps Semgrep, Gitleaks, and Trivy as tools accessible to both Claude Code and Gemini CLI:

```json
// .claude/settings.json + GEMINI.md mcp config
{
  "mcpServers": {
    "security-scanner": {
      "command": "npx",
      "args": ["-y", "mcp-security-scanner"],
      "description": "Semgrep + Gitleaks + Trivy as MCP tools"
    }
  }
}
```

Benefits:
- Gemini can directly trigger scans (not just receive results via pipe)
- Claude can share scan results with Gemini without file intermediaries
- Unified tool interface regardless of which CLI calls the scan

### Shared Memory MCP Server

Cross-agent persistent context:

```json
{
  "mcpServers": {
    "memory": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] }
  }
}
```

Use cases:
- Planner stores task decomposition → Haiku workers read it
- Reviewer stores findings → Reporter reads them directly
- Cache state accessible to all agents

### Review Cache via MCP

Move `.multi-agent-cache/` from file system to MCP memory server:
- All agents read/write cache via the same MCP interface
- No file path coordination needed between Claude and Gemini

### New Config

```json
{
  "mcp": {
    "security_scanner": true,
    "shared_memory": true,
    "cache_via_mcp": false
  }
}
```

---

## v0.5.0 — CI/CD Integration

**Theme**: Run the multi-agent pipeline in GitHub Actions on every PR.

### GitHub Actions Workflows

```yaml
# .github/workflows/multi-agent-review.yml
# Triggers on: PR opened, PR updated
# Uses: Claude Code CLI + Gemini CLI in CI environment

jobs:
  security-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: raomaster/setup-multi-agent@v1   # new action
      - run: npx secure-coding-agent --no-security  # security already in CI
      - run: claude --print -p "/scan-all && /report"
      - uses: actions/upload-artifact@v4
        with:
          name: security-report
          path: security-report-*.md
```

### PR Review Automation

- Auto-comment on PRs with security findings above threshold
- Block merge if CRITICAL findings detected
- Security badge in PR: `🟢 Clean | 🟡 Medium | 🔴 Critical`

### New Package

- `setup-multi-agent` GitHub Action for CI/CD environments
- Handles auth for Claude Pro + Google One in GitHub Actions secrets

---

## v1.0.0 — Stable

**Theme**: Production-ready, fully documented, battle-tested.

### Stability

- Full test suite: unit tests for installer, integration tests per skill
- Schema validation for `.multi-agent.json` with helpful error messages
- Windows native support (not just WSL2)
- Comprehensive error handling with recovery suggestions

### Plugin System

Allow third-party CLI adapters without modifying core:

```json
// .multi-agent.json
{
  "plugins": [
    { "name": "my-custom-cli", "package": "@myorg/mca-plugin-mycli" }
  ]
}
```

### Observability

- `/stats` skill: token usage estimates, cost per role, cache hit rate
- Session log: `.multi-agent-cache/session-log.jsonl`
- Structured output for all skills (`--json` flag)

### Enterprise Features

- Team-shared `.multi-agent.json` via git (role assignments per environment)
- Secret management for CLI credentials via environment variables
- Audit log of all agent actions

---

## Backlog (unversioned)

Ideas that need more research before scheduling:

- **Multi-language support**: non-English `CLAUDE.md` / `GEMINI.md` generation
- **Auto-model selection**: detect subscription tier and auto-assign optimal models
- **Diff-aware review**: only review lines changed in the current PR (not full files)
- **Learning cache**: flag findings that were marked false-positive to avoid re-reporting
- **OpenCode support**: deeper integration when opencode.ai matures its non-interactive mode
- **Codex review role**: use o3 as reviewer for algorithmic correctness (complement to Gemini security)
- **Cost estimator**: before running `/full-cycle`, estimate token usage and warn if expensive
- **Snapshot diff**: compare two checkpoints to see exactly what changed between agent runs

---

## How to Contribute

1. Open an issue describing the feature and which version it targets
2. PRs welcome — align with the version's theme
3. New CLI adapters: add to `.multi-agent.json` `cli_adapters` + update `src/roles.ts`
4. New skills: add to `.claude/commands/` + update `src/meta.ts` `PIPELINE_SKILLS`
