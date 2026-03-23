# Usage Walkthrough

This is the shortest practical walkthrough for showing what Secure Coding Agent does and how it works.

## Goal

Show that the project is:

- installable
- testable
- understandable
- differentiated

## 60–90 second walkthrough

### 1. Open with the problem

Say:

> AI coding tools are powerful, but most teams still use them without role boundaries, security review structure, or rollback discipline.

### 2. Show the product surface

In the repo root:

```bash
npm run verify
```

What to highlight:

- build passes
- tests pass
- package dry-run passes
- CI mirrors the same flow

### 3. Show the working model

Open `.multi-agent.json` and explain:

- planner
- coder
- reviewer
- reporter
- specialist

Then open `README.md` and point to:

- stable commands
- preview commands
- quickstart

### 4. Show the example project

Use [`examples/minimal-api`](../examples/minimal-api/README.md) or paste the install prompt from `docs/guide/installation.md` into your host agent.

```bash
cd examples/minimal-api
npx secure-coding-agent --host auto --no-security
```

Show the installed files:

- `CLAUDE.md` or `AGENTS.md`
- `.multi-agent.json`
- `.claude/commands/*` or `.opencode/command/*`

### 5. Close with the thesis

Say:

> The differentiator is not just using multiple models. The differentiator is security-first orchestration for AI coding workflows, with reproducibility, review structure, and operational safety.

## Useful assets

- one screenshot of the README hero
- one terminal capture of `npm run verify`
- one terminal capture of install into the example project
- one diagram image or README flow
