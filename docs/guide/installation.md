# Installation Guide

## For Humans

Paste this into your AI agent session:

```text
Install and configure secure-coding-agent in this repository by following the instructions here:
https://raw.githubusercontent.com/raomaster/secure-coding-agent/main/docs/guide/installation.md

Use curl to fetch the guide.
Default to --host auto.
Keep the security layer enabled unless I explicitly ask to skip it.
If oh-my-openagent / oh-my-opencode is already present, install the OMO-aware setup.
Only ask questions if the host setup is genuinely ambiguous.
```

Manual fallback:

```bash
npx secure-coding-agent --host auto
```

## For LLM Agents

IMPORTANT: fetch this file with `curl`, not a summarized web fetch.

```bash
curl -fsSL https://raw.githubusercontent.com/raomaster/secure-coding-agent/main/docs/guide/installation.md
```

Follow these steps.

### Step 1: Identify the target repository

- Default to the current working directory unless the user gave a specific target.
- If the target directory does not exist, stop and ask for a valid path.

### Step 2: Resolve the host mode

Use this decision order:

1. If the user explicitly says `Claude Code`, use `--host claude-code`.
2. If the user is clearly working inside `oh-my-openagent` / `oh-my-opencode`, use `--host opencode-omo`.
3. If the repo already contains OmO markers such as `.opencode/oh-my-opencode.json`, `.opencode/oh-my-opencode.jsonc`, or `.sisyphus/`, use `--host opencode-omo`.
4. If the repo contains `.opencode/` plus Claude-compatible OmO markers such as `.claude/agents/` or `.claude/rules/`, use `--host opencode-omo`.
5. If the repo contains OpenCode markers such as `.opencode/`, `opencode.json`, `opencode.jsonc`, or `AGENTS.md`, treat it as OpenCode.
6. Otherwise, use `--host auto`.

### Step 3: Handle plain OpenCode carefully

If you detect OpenCode but not OmO, ask one targeted question:

> I found an OpenCode setup without oh-my-openagent. Recommended: bootstrap OmO first and then install `secure-coding-agent` in `opencode-omo` mode. If you prefer, I can install plain OpenCode mode instead.

If the user chooses the recommended path:

1. Follow the official OmO installation guide.
2. Re-run `secure-coding-agent` with `--host opencode-omo`.

If the user declines, continue with `--host opencode`.

### Step 4: Run the installer

Default command:

```bash
npx secure-coding-agent --host auto
```

Examples:

```bash
npx secure-coding-agent --host claude-code
npx secure-coding-agent --host opencode
npx secure-coding-agent --host opencode-omo
npx secure-coding-agent --host opencode-omo --target /path/to/project
```

Keep the security layer enabled unless the user explicitly asks for `--no-security`.

### Step 5: Explain what was installed

Tell the user the resolved host and the key files:

- `claude-code`
  - `CLAUDE.md`
  - `.claude/commands/*`
  - `.claude/skills/create-skill/SKILL.md`
  - `.multi-agent.json`
- `opencode`
  - `AGENTS.md`
  - `.opencode/command/*`
  - `.opencode/skills/create-skill/SKILL.md`
  - `.multi-agent.json`
- `opencode-omo`
  - `AGENTS.md`
  - `.claude/commands/*`
  - `.claude/skills/create-skill/SKILL.md`
  - `.claude/agents/*`
  - `.multi-agent.json`
  - `Aegis` from `agent-security-policies`

### Step 6: Verify the install

Check the relevant files exist and explain the next command to try:

- `/plan`
- `/full-cycle`
- `/roles`

If the host is `opencode-omo`, explicitly mention that built-in OmO agents stay intact and `Aegis` is the added security companion.
If the user asks about plan persistence, explain that `.multi-agent.json` can opt into `.secure-coding/plan.md` and `.secure-coding/tasks.md` later.
