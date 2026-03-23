# Skills Reference

Complete reference for the workflow commands and packaged skills available after installing `secure-coding-agent`.

Stable in `v0.2.x`:
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
- Optional `.secure-coding/plan.md` and `.secure-coding/tasks.md` when persistence is enabled or explicitly requested

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

**Reads**: `.multi-agent.json` → `host`, `roles.coder`, and optional persistence settings.

**Parallel execution**: For tasks without shared files, sends multiple Bash calls in the same message.

**If output is wrong**: Run `/rollback` — cheaper than trying to fix with more AI.

---

### `/review`

**Phase**: 4 — Security Review
**Agent**: Configured `reviewer` role (host-aware default)

Runs security review on changed files using the configured reviewer.

```
/review
/review src/auth/ src/middleware/
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
/report for the last implementation pass
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
checkpoint → plan → [confirm] → code → review → report
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

## Packaged reusable skills

### `create-skill`

**Path**:

- `.claude/skills/create-skill/SKILL.md` for `claude-code` and `opencode-omo`
- `.opencode/skills/create-skill/SKILL.md` for `opencode`

Creates or refines reusable project skills using the secure-coding-agent skill contract.

Use it when you want to:

- create a new repo-local skill
- refactor an existing skill into a clearer format
- align a skill with local workflow, security, or naming conventions

The skill follows the project format from `agent-security-policies` and encourages deterministic sections such as prerequisites, run instructions, output format, interpretation rules, and next steps.

### OmO custom agents

When the host is `opencode-omo`, the installer also adds these project agents in `.claude/agents/`:

- `Valkyrie-Forge` — bounded implementation worker
- `Valkyrie-Check` — focused validation worker
- `Barrier-Review` — final risk review worker
- `Archive-Note` — handoff and documentation worker

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

## Future workflows

The roadmap now focuses on:

- richer `.secure-coding/` artifacts and checkpoints
- smarter runtime validation and diagnostics
- deeper MCP-backed shared context
- broader CI-native review and reporting workflows

See [ROADMAP.md](../ROADMAP.md) for the forward-looking milestones.
