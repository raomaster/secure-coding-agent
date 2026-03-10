# Changelog

All notable changes to `secure-coding-agent` are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

---

## [0.1.0] — 2026-03-09

### Added

**Core multi-agent system**
- Two-layer installation: `agent-security-policies` (security) + orchestration layer
- `npx secure-coding-agent` CLI — installs both layers in any project
- `install.sh` — bash alternative for quick local setup

**Agent roles (5 roles)**
- `planner` — Claude Sonnet 4.6 (orchestrator, runs as Claude Code session)
- `coder` — Claude Haiku 4.5 (spawned workers, parallel execution)
- `reviewer` — Gemini 3.1 Pro (security review, 2M token context)
- `reporter` — Gemini Flash (executive reports, fast summaries)
- `specialist` — Codex o4-mini (complex algorithms, second opinion)

**Role configuration system**
- `.multi-agent.json` — per-project role config, editable without touching skills
- `/roles` skill — view and change role assignments at runtime
- CLI adapters defined for: `claude`, `gemini`, `codex`, `github-copilot`, `opencode`

**Pipeline skills (8 skills)**
- `/plan` — Phase 1+2: codebase research + structured task plan
- `/code` — Phase 3: delegate implementation to coder (reads `.multi-agent.json`)
- `/review` — Phase 4: security review (reads `.multi-agent.json`)
- `/report` — Executive report (reads `.multi-agent.json`)
- `/full-cycle` — Full pipeline with automatic checkpoint
- `/checkpoint` — Create git stash checkpoint before agent changes
- `/rollback` — Restore to any previous checkpoint
- `/roles` — View and modify role assignments

**Security skills (7 skills, via agent-security-policies)**
- `/sast-scan` — Semgrep static analysis, CWE-mapped
- `/secrets-scan` — Gitleaks credential detection
- `/dependency-scan` — Trivy CVE scanning for dependencies
- `/container-scan` — Trivy Docker image scanning
- `/iac-scan` — KICS IaC misconfiguration detection
- `/threat-model` — STRIDE threat modeling with Gemini Pro
- `/fix-findings` — AI-assisted remediation of scan findings

**Safety mechanisms**
- Automatic git stash checkpoint before every `/code` and `/full-cycle` execution
- `/rollback` with support for git stash (primary) and file-copy fallback (non-git repos)
- Rollback-first philosophy: revert bad agent output rather than trying to fix it with more AI
- Explicit user confirmation required before rollback execution

**Subscription optimization**
- No Opus usage (consumes full Claude Pro quota in one prompt)
- Haiku for code generation (fastest, cheapest in Claude Pro)
- Gemini token caching for `GEMINI.md` and `AGENT_RULES.md`
- Gemini Flash for reports (fast, low cost within Google One)

**TypeScript source**
- `src/cli.ts` — CLI entry point with `--help`, `--version`, `--target`, `--mcp`, `--no-security`, `--profile`
- `src/installer.ts` — Two-layer installation logic
- `src/args.ts` — Argument parsing
- `src/meta.ts` — Package constants
- `src/roles.ts` — Role types and command builder utilities

**Compatible CLIs (subscription-based, no API key required)**
- Claude Code — Claude Pro subscription
- Gemini CLI — Google One AI Premium subscription
- Codex CLI — ChatGPT Plus/Pro subscription

### Security

- All agent instructions enforce: OWASP ASVS 5.0.0, CWE/SANS Top 25 2025, NIST SSDF 1.1
- `GEMINI.md` security checklist auto-cached after first use
- Security rules sourced from [agent-security-policies](https://github.com/raomaster/agent-security-policies)

---

## Versioning Policy

- `MAJOR` — breaking changes to `.multi-agent.json` schema or skill invocation protocol
- `MINOR` — new skills, new CLI adapters, new pipeline stages
- `PATCH` — bug fixes, documentation, improved skill instructions
