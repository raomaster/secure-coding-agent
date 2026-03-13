# Design Decisions

This document captures the high-signal architectural decisions behind Secure Coding Agent.

---

## ADR-001 — Use role-based orchestration instead of free-form multi-model prompting

**Decision**

The system assigns explicit roles to AI CLIs: planner, coder, reviewer, reporter, specialist.

**Why**

- makes behavior easier to reason about
- reduces prompt drift
- improves reproducibility
- creates a clear product narrative

**Tradeoff**

- less flexible than letting any model do everything

---

## ADR-002 — Keep runtime configuration in `.multi-agent.json`

**Decision**

Role-to-CLI and model mappings live in `.multi-agent.json`.

**Why**

- human-readable and easy to diff
- simple to validate later
- easy to install into existing repositories
- avoids baking provider choices into prompt files

**Tradeoff**

- limited expressiveness compared to a richer config system

---

## ADR-003 — Treat security review as part of delivery, not a separate product

**Decision**

Review is embedded in the workflow between implementation and reporting.

**Why**

- security should shape delivery quality, not sit outside it
- this is the project’s main differentiator
- it aligns better with professional software engineering practice

**Tradeoff**

- the workflow is slightly heavier than pure generation-first tools

---

## ADR-004 — Prefer subscription-based CLIs over API-first setup

**Decision**

The project is optimized around existing coding CLIs with subscriptions, not raw API integration.

**Why**

- lower setup friction for real users
- better fit for hands-on engineers already using these tools
- practical workflow design, not just SDK glue

**Tradeoff**

- runtime behavior depends on local CLI installation and auth state

---

## ADR-005 — Make rollback a primitive, not a recovery afterthought

**Decision**

Checkpoint and rollback are built into the command model.

**Why**

- agent output can be wrong even when prompts are good
- rollback is cheaper than iterative repair in many real workflows
- this encodes operational maturity into the tool

**Tradeoff**

- git state becomes part of the workflow contract

---

## ADR-006 — Ship file-based command workflows before building a hidden runtime

**Decision**

Commands are installed as visible markdown workflows under `.claude/commands/`.

**Why**

- transparent and inspectable
- easy to version and explain
- well suited to open source credibility and maintainability

**Tradeoff**

- command behavior is documentation-driven, so precision matters more

---

## ADR-007 — Separate stable surfaces from preview workflows

**Decision**

The project distinguishes between stable command surfaces and evolving workflows.

**Why**

- protects trust in the core
- allows frontier experimentation without pretending everything is production-stable
- makes roadmap claims more credible

**Tradeoff**

- requires stronger README and docs discipline
