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

## v0.2.0 — Review contract + cache

Focus:

- validate `.multi-agent.json` on load
- add review cache primitives
- expose cache status and cache clear workflows
- formalize stable review behavior vs preview security-review behavior

Expected outcome:

- lower repeated review cost
- clearer runtime behavior
- stronger workflow credibility

---

## v0.3.0 — Policy-aware security review

Focus:

- mature `/security-review`
- unify static findings + AI review into a cleaner report contract
- improve command generation from role config
- reduce environment ambiguity around scanners and reporters

Expected outcome:

- the project becomes clearly differentiated as a security-first orchestration system

---

## v0.4.0 — Shared context and advanced orchestration

Focus:

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
