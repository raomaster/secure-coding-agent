# Compatibility Policy

## Supported baseline

Secure Coding Agent currently targets:

- Node.js `>=18`
- macOS
- Linux

CI validates:

- Ubuntu latest
- macOS latest
- Node 20
- Node 22

Windows / WSL is not yet first-class support.

## Required local tooling

### Always required

- Node.js
- npm

### Required for full workflow value

- `@anthropic-ai/claude-code`
- `opencode` for OpenCode host mode
- `oh-my-openagent` for the full `opencode-omo` host mode

### Optional role runtimes

- `@google/gemini-cli`
- `@openai/codex`

### Required for the security layer installed by default

- network access for `npx agent-security-policies`

### Required for preview security-review flows

- Docker, or local installs of:
  - Semgrep
  - Gitleaks
  - Trivy

## Stable command contract

The stable `v0.2.x` contract includes:

- install via `npx secure-coding-agent`
- prompt-based install guidance via `docs/guide/installation.md`
- positional target path
- `--host auto|claude-code|opencode|opencode-omo`
- `.multi-agent.json`
- optional `.secure-coding/` persistence controlled from config
- `create-skill` as a packaged reusable skill
- OmO custom agents for `opencode-omo`
- `/plan`, `/code`, `/review`, `/report`, `/full-cycle`
- `/checkpoint`, `/rollback`, `/roles`

## Preview command contract

The following are shipped as preview / evolving workflows:

- `/lint`
- `/security-review`

These are useful, but they rely on more environment assumptions and may evolve faster than the stable core.

## Behavior when dependencies are missing

Current behavior:

- if the target directory does not exist, installation fails
- if `agent-security-policies` cannot be run, the installer fails unless `--no-security` is used
- if `--host auto` cannot infer OpenCode or OmO from the repo, it falls back to `claude-code`
- if a command depends on an unavailable external CLI, the workflow becomes unavailable at runtime

The project does not yet provide full runtime dependency diagnostics for every installed command.

## Versioning intent

Semantic versioning is used with this meaning:

- `MAJOR`: breaking changes to config or command contract
- `MINOR`: new commands, new integrations, stable capability expansion
- `PATCH`: bug fixes, docs, installer corrections, workflow precision improvements
