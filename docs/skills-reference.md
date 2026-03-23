# Skills Reference

Complete reference for all Claude Code slash commands available after installing `secure-coding-agent`.

Stable in `v0.1.x`:
- `/plan`
- `/code`
- `/review`
- `/report`
- `/full-cycle`
- `/checkpoint`
- `/rollback`
- `/roles`

Preview / evolving workflows:
- `/lint`
- `/security-review`

---

## Pipeline Skills (this package)

### `/plan`

**Phase**: 1 + 2 — Research + Planning
**Agent**: Configured `planner` host/runtime (host-aware default)

Analyzes a requirement, explores the codebase, and produces a structured task plan for Haiku workers.

```
/plan implement JWT refresh token rotation
/plan add rate limiting to the /api/users endpoint
/plan refactor the database connection pool
```

**Output**: Structured task list with:
- Task description and scope
- Files to modify per task
- Dependencies between tasks
- Which tasks can run in parallel (no shared files)
- Initial security surface analysis
- Recommendation for `/threat-model` if new trust boundaries are introduced

**When to use**: Before any `/code` call. If you skip `/plan`, Haiku workers may make conflicting changes.

---

### `/code`

**Phase**: 3 — Implementation
**Agent**: Configured `coder` role (host-aware default)

Delegates code implementation to the coder CLI. Creates a checkpoint automatically before any file changes.

```
/code implement the auth middleware per the plan above
/code add input validation to all POST endpoints in src/api/
```

**Auto-checkpoint**: Creates `mca-checkpoint: before-code-TIMESTAMP` git stash before running.

**Reads**: `.multi-agent.json` → `roles.coder` to determine which CLI and model to use.

**Parallel execution**: For tasks without shared files, sends multiple Bash calls in the same message.

**If output is wrong**: Run `/rollback` — cheaper than trying to fix with more AI.

---

### `/review`

**Phase**: 4 — Security Review
**Agent**: Configured `reviewer` role (host-aware default)

Runs security review on changed files. In v0.2.0+, checks cache first — only sends files that changed since last review.

```
/review
/review src/auth/ src/middleware/
/review --force    (v0.2.0: bypass cache, force full review)
```

**Standards applied**: OWASP ASVS 5.0, CWE/SANS Top 25 2025, NIST SSDF 1.1

**Output format**:
| Severity | CWE | File:Line | Description | Fix |

**Severity triage**:
- `CRITICAL` → Rollback immediately, replanning needed
- `HIGH` → Fix before merge, use `/fix-findings`
- `MEDIUM` → Issue for next sprint
- `LOW/INFO` → Document in `SECURITY_DECISIONS.md`

---

### `/report`

**Phase**: Final — Executive Summary
**Agent**: Configured `reporter` role (host-aware default)

Generates a markdown executive report from all findings in the current session.

```
/report
/report include-cache-findings    (v0.2.0: include historical findings from cache)
```

**Output**: `security-report-YYYYMMDD.md` with status badge, top actions, metrics, and remediation roadmap.

---

### `/full-cycle`

**Phase**: All
**Agent**: All roles in sequence

Runs the complete pipeline with automatic checkpoint at start.

```
/full-cycle add OAuth2 login to the API
/full-cycle refactor payment processing module
```

**Pipeline**:
```
checkpoint → plan → [confirm] → code (Haiku workers) → review (Gemini Pro) → report (Gemini Flash)
```

**v0.2.0 pipeline**:
```
checkpoint → plan → [confirm] → code → lint → lint-fix → sast-scan → review → report
```

---

### `/checkpoint`

**Safety**: Creates a git stash checkpoint.

```
/checkpoint
/checkpoint before-auth-refactor
/checkpoint before-payment-module-changes
```

**When to use**: Manually, before risky changes. `/code` and `/full-cycle` call this automatically.

**Storage**: `git stash push -m "mca-checkpoint: LABEL"`

---

### `/rollback`

**Safety**: Restores to a previous checkpoint.

```
/rollback                    # restore most recent checkpoint
/rollback 1                  # restore checkpoint at index 1
/rollback before-auth-refactor  # restore by label
```

**Lists available checkpoints** before executing. Asks for explicit confirmation.

**Philosophy**: Rolling back bad agent output is **always** cheaper than trying to fix it with more AI prompts.

---

### `/roles`

**Config**: View and modify role assignments.

```
/roles                              # show current stack
/roles set coder codex o4-mini      # change coder to Codex
/roles set reviewer gemini flash    # use Flash instead of Pro for reviews
/roles set coder opencode auto      # switch to OpenCode
```

**Changes take effect immediately** — all skills read `.multi-agent.json` at runtime.

---

### `/lint`

**Phase**: Preview
**Agent**: Local tooling

Runs language-aware linting before deeper review workflows.

Use when you want faster, lower-cost feedback before AI review.

---

### `/security-review`

**Phase**: Preview
**Agent**: Static scanners + configured reviewer/reporter

Runs a broader review workflow that combines static findings and AI review.

Use when a higher-cost, higher-signal review is justified.

---

## Security Skills (from agent-security-policies)

These are installed by `npx agent-security-policies --skills`. See [agent-security-policies](https://github.com/raomaster/agent-security-policies) for full docs.

### `/sast-scan`

Runs Semgrep static analysis. Findings mapped to CWE IDs.

```
/sast-scan
/sast-scan src/api/         # scan specific directory
```

**Tool**: Semgrep (Docker or local)
**Output**: `sast-report.json` + Gemini Pro analysis

### `/secrets-scan`

Detects hardcoded credentials (API keys, passwords, tokens).

```
/secrets-scan
/secrets-scan --history     # scan full git history
```

**Tool**: Gitleaks
**⚠️ If real secrets found**: Revoke immediately, then fix code.

### `/dependency-scan`

Scans for CVEs in project dependencies (npm, pip, cargo, go.mod, etc.).

```
/dependency-scan
```

**Tool**: Trivy fs
**Output**: `dependency-report.json` + prioritized update list

### `/container-scan`

Scans Docker images for OS and application layer CVEs.

```
/container-scan myapp:latest
/container-scan                 # auto-detects image from Dockerfile
```

**Tool**: Trivy image

### `/iac-scan`

Detects misconfigurations in Terraform, Kubernetes, Docker Compose, CloudFormation, Helm.

```
/iac-scan
/iac-scan infrastructure/
```

**Tool**: KICS

### `/threat-model`

Generates a STRIDE threat model for a component or feature.

```
/threat-model the authentication service
/threat-model the payment processing API
/threat-model new file upload feature
```

**Tool**: Gemini 3.1 Pro (uses full 2M context to analyze architecture)
**Output**: `threat-model-YYYYMMDD.md` with DFD, trust boundaries, STRIDE table, top risks, NIST controls

### `/fix-findings`

AI-assisted remediation of findings from any scan.

```
/fix-findings sast-report.json
/fix-findings secrets-report.json
/fix-findings dependency-report.json
```

**Flow**: Reads report → triages by severity → implements fixes (Sonnet for < 30 lines, Haiku via `/code` for complex) → verifies with re-scan

---

## Planned Skills (v0.2.0)

### `/lint`

Runs the appropriate linter for the detected language. See [ROADMAP.md](../ROADMAP.md).

### `/lint-fix`

Delegates linter finding fixes to the coder (Haiku by default).

### `/cache-status`

Shows which files have been security-reviewed and their current status.

### `/cache-clear`

Invalidates security review cache entries (force full re-review on next `/review`).

---

## Planned Skills (v0.3.0)

### `/devsecops-cycle`

Full automated pipeline: checkpoint → plan → code → lint → lint-fix → scan-all → fix-all → review → report

### `/scan-all`

Runs all security scans in parallel (SAST + secrets + deps) and merges findings.

### `/fix-all`

Single AI pass to fix all consolidated findings from all scanners.
