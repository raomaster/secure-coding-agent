# Roadmap

Strategic direction for `secure-coding-agent`.

Principle:

> Keep the core installable workflow reliable, and only expand into higher-cost agent/security flows when the contract is clear.

---

## v0.1.x — Product hardening

Focus:

- align README, installers, package metadata, and command surface
- separate stable workflows from preview workflows
- tighten installation idempotence and CLI UX
- expand cross-platform verification

Expected outcome:

- clear product positioning
- reliable installation
- professional open source presentation

---

## v0.2.0 — Host-aware workflow bundles

Focus:

- promote `claude-code`, `opencode`, and `opencode-omo` to first-class host modes
- ship host-specific guidance, commands, skills, and OmO custom agents
- add optional `.secure-coding/` persistence settings for plans and task lists
- install a reusable `create-skill` skill for local workflow extension

Expected outcome:

- clearer runtime behavior across hosts
- stronger OpenCode / OmO story
- stronger workflow credibility

---

## v0.3.0 — Validation + diagnostics

Focus:

- validate `.multi-agent.json` on load
- add smarter runtime dependency diagnostics
- tighten command generation from role config and host capabilities
- reduce environment ambiguity around scanners and optional runtimes

Expected outcome:

- lower operator confusion and fewer broken runtime combinations

---

## v0.4.0 — Shared context and richer artifacts

Focus:

- richer `.secure-coding/` artifacts and checkpoints
- MCP-backed shared memory
- scanner orchestration via MCP or a clearer tool abstraction
- richer reviewer / reporter coordination

Expected outcome:

- stronger “frontier workflow” story without bloating the stable core

---

## v0.5.0 — CI-native review workflows

Focus:

- first-class GitHub review workflow
- artifacts and reports for PR use
- optional action or setup flow for CI environments

Expected outcome:

- project is usable as both developer tooling and a platform-quality review system
