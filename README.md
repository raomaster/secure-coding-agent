# Secure Coding Agent

![Secure Coding Agent wordmark](https://raw.githubusercontent.com/raomaster/secure-coding-agent/main/assets/wordmark.svg)

[![CI](https://github.com/raomaster/secure-coding-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/raomaster/secure-coding-agent/actions/workflows/ci.yml)
![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Status v0.2](https://img.shields.io/badge/status-v0.2%20stable-0a7f5a)

**A security-first workflow layer for Claude Code and OpenCode-based agents.**

Secure Coding Agent turns subscription-based coding CLIs into a structured secure development workflow with planning, implementation, review, reporting, and rollback built in.

- Coordinate **Claude Code, OpenCode, Codex, and optional review runtimes** through explicit roles instead of ad hoc prompting.
- Keep security **inside the development workflow**, not as a disconnected afterthought.
- Install a reproducible workflow with **config, commands, checkpoints, CI validation, and docs**.

## Why this exists

AI-assisted development is productive, but the default workflow is still weak:

- prompts are inconsistent
- model roles are implicit
- security review is often bolted on too late
- rollback and reproducibility are usually missing

Secure Coding Agent exists to answer a specific problem:

> How do you turn AI coding CLIs into a disciplined, security-aware workflow that is usable by real engineers?

This project treats AI-assisted development as a systems problem:
- role orchestration
- safe defaults
- reproducible installation
- policy-aware review
- explicit operational boundaries

## Quickstart

### Recommended: let an agent install it

Copy and paste this prompt into your agent session:

```text
Install and configure secure-coding-agent in this repository by following the instructions here:
https://raw.githubusercontent.com/raomaster/secure-coding-agent/main/docs/guide/installation.md

Use curl to fetch the guide.
Default to --host auto.
Keep the security layer enabled unless I explicitly ask to skip it.
If oh-my-openagent / oh-my-opencode is already present, install the OMO-aware setup.
Only ask questions if the host setup is genuinely ambiguous.
```

### Fallback: run the CLI yourself

Run it from the root of the project you want to bootstrap:

```bash
npx secure-coding-agent
```

Install into a different project without changing directory:

```bash
npx secure-coding-agent /path/to/project
```

## What you get

Secure Coding Agent installs a two-layer workflow:

```text
Layer 1: npx agent-security-policies  -> security rules, policies, baseline agent guidance
Layer 2: npx secure-coding-agent      -> orchestration, role config, pipeline commands
```

Core roles:

| Role | Default CLI / model | Responsibility |
|---|---|---|
| Planner | Claude Sonnet 4.6 or OpenCode host | Research, decomposition, orchestration |
| Coder | Claude Haiku 4.5 or OpenCode host | Implementation workers |
| Reviewer | Gemini 3.1 Pro or OpenCode host | Security review |
| Reporter | Gemini Flash or OpenCode host | Executive reporting |
| Specialist | Codex o4-mini | Second opinion / complex problem solving |

## How it works

```mermaid
flowchart TD
    A["Developer request"] --> B["/plan<br/>Planner"]
    B --> C["Task breakdown<br/>and security surface analysis"]
    C --> D["/code<br/>Coder workers"]
    D --> E["Checkpoint + rollback safety"]
    E --> F["/review<br/>Reviewer"]
    F --> G["/report<br/>Reporter"]
    G --> H["Decision-ready output"]
```

Key design choices:

- **Role-driven orchestration**: each model has a defined job
- **Host-aware install**: `claude-code`, `opencode`, and `opencode-omo` install different surfaces
- **Config-driven runtime**: `.multi-agent.json` controls the preferred stack and runtime commands
- **Rollback-first safety**: agent output can be reverted cheaply
- **Security-first workflow**: review is part of delivery, not a separate ritual

## Stable today

These flows are part of the current `v0.2.x` stable surface:

- `npx secure-coding-agent`
- prompt-based install via `docs/guide/installation.md`
- positional target path support
- `--host auto|claude-code|opencode|opencode-omo`
- `.multi-agent.json` installation and role configuration
- built-in `create-skill` skill
- OmO custom agents for `opencode-omo`
- `/plan`, `/code`, `/review`, `/report`, `/full-cycle`
- `/checkpoint`, `/rollback`, `/roles`
- TypeScript installer + bash installer
- `npm run verify`
- CI validation on GitHub Actions

## Experimental today

These capabilities are intentionally shipped as **preview / evolving workflows**:

- `/lint`
- `/security-review`
- deeper MCP-based shared context and scanner orchestration

The goal is to keep the core reliable while higher-value workflows mature in public.

## Who this is for

Secure Coding Agent is built for:

- engineers using AI coding tools who want a more disciplined workflow
- AppSec / product security engineers experimenting with agent-assisted delivery
- engineering leads who want reproducible AI workflows instead of prompt folklore
- builders creating internal tooling around secure AI development

It is **not** positioned as:

- a generic “AI wrapper”
- a replacement for your existing CI/CD platform
- a fully autonomous software factory

## What makes it different

Most AI coding tools optimize for raw generation speed.

Secure Coding Agent optimizes for:

- **security-aware execution**
- **role governance across models**
- **structured review and reporting**
- **operational reproducibility**
- **installation into existing repos, not only greenfield repositories**

The differentiator is not “more models”.
The differentiator is **security-first orchestration for AI coding workflows**.

## Proof

This repository includes the artifacts needed to evaluate the project as a serious engineering system:

- [Architecture](docs/architecture.md)
- [Design Decisions](docs/design-decisions.md)
- [Use Cases](docs/use-cases.md)
- [Compatibility Policy](docs/compatibility.md)
- [Skills Reference](docs/skills-reference.md)
- [Usage Walkthrough](docs/usage-walkthrough.md)
- [Example Project](examples/minimal-api/README.md)

Validation:

```bash
npm run verify
```

That runs:
- build
- unit and installer tests
- package dry-run

## Compatibility

Supported baseline:

- Node.js `>=18`
- macOS and Linux are validated in CI
- Windows/WSL is roadmap-level support, not yet first-class

Required CLIs depend on the workflow you want:

| Capability | Requirement |
|---|---|
| Orchestration install | Node.js + npm |
| Full security layer | `agent-security-policies` install path via `npx` |
| Claude host mode | `@anthropic-ai/claude-code` |
| OpenCode host mode | `opencode` |
| OpenCode + OmO host mode | `opencode` + `oh-my-openagent` |
| Optional Codex specialist role | `@openai/codex` |
| Optional Gemini review/reporting | `@google/gemini-cli` |

See [docs/compatibility.md](docs/compatibility.md) for explicit behavior and limitations.

## Commands

### Stable workflow commands

| Command | Purpose |
|---|---|
| `/plan` | Explore the codebase and produce a structured implementation plan |
| `/code` | Delegate implementation to the configured coder |
| `/review` | Run AI security review with the configured reviewer |
| `/report` | Generate executive output from findings |
| `/full-cycle` | Execute the end-to-end workflow |
| `/checkpoint` | Create a manual safety checkpoint |
| `/rollback` | Restore a previous checkpoint |
| `/roles` | Show or change role assignments |

### Preview commands

| Command | Purpose |
|---|---|
| `/lint` | Run language-aware linting |
| `/security-review` | Run a broader static + AI review workflow |

### Packaged reusable skill

| Skill | Purpose |
|---|---|
| `create-skill` | Create or refine repo-local skills using the project skill contract |

## Installation details

### Prerequisites

```bash
# Claude Code
npm i -g @anthropic-ai/claude-code

# Gemini CLI
npm i -g @google/gemini-cli
gemini auth login

# Codex CLI
npm i -g @openai/codex
codex
```

### From npm (fallback/manual)

```bash
# Run in the current project
npx secure-coding-agent

# Let the installer infer the host from the repo
npx secure-coding-agent --host auto

# Force OpenCode + oh-my-openagent mode
npx secure-coding-agent --host opencode-omo

# Install globally if preferred
npm i -g secure-coding-agent
secure-coding-agent

# Advanced: install into another project
npx secure-coding-agent /path/to/project
```

### From source

```bash
git clone https://github.com/raomaster/secure-coding-agent.git
cd secure-coding-agent
npm install
npm run verify
```

### What gets installed

Layer 2 from this package installs:

- `CLAUDE.md` for `claude-code` hosts
- `AGENTS.md` for `opencode` and `opencode-omo` hosts
- `.multi-agent.json` role configuration with host-aware defaults and optional `.secure-coding/` persistence settings
- `.claude/commands/*` for `claude-code` and `opencode-omo`
- `.opencode/command/*` for plain `opencode`
- `create-skill` in `.claude/skills/` or `.opencode/skills/` depending on host
- OmO custom agents in `.claude/agents/` for `opencode-omo`
- OmO built-ins remain untouched; `secure-coding-agent` only adds complementary project agents
- optional `.claude/settings.json` for Claude Code MCP

## Roadmap

Near-term roadmap:

- richer `.secure-coding/` persistence and artifact workflows
- stronger OpenCode / OmO command specialization
- optional role validation and smarter diagnostics
- MCP-backed shared memory and scanner orchestration
- CI-native review workflows and artifacts

See [ROADMAP.md](ROADMAP.md) for the full progression.

## Credits

- Security policies foundation: [agent-security-policies](https://github.com/raomaster/agent-security-policies)
- Workflow inspiration from role-specialized coding agent systems and practical secure development pipelines
