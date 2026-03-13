# Minimal API Example

This example project exists to show how Secure Coding Agent installs into a real repository.

## Purpose

Use this folder as an example target when you want to inspect:

- installation into an existing codebase
- resulting workflow files
- reproducible before/after project state

## Before

The example starts as a tiny Node.js HTTP API with no orchestration files installed.

## Install the orchestration layer

From inside this directory:

```bash
npx secure-coding-agent --no-security
```

This installs the orchestration layer only, which is enough for validating:

- role configuration
- workflow commands
- checkpoint / rollback model
- README-driven product flow

## Expected output

After installation, you should see:

```text
CLAUDE.md
GEMINI.md
.multi-agent.json
.claude/commands/
```

## Suggested prompts

- `/plan add request validation and request ids to this API`
- `/review`
- `/full-cycle add structured error handling`

## Why this example is intentionally small

This is not meant to be a production application.
It is a controlled repo that makes the installation and workflow behavior easy to inspect and validate.
