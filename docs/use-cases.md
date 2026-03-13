# Use Cases

This document describes realistic workflows that Secure Coding Agent is designed to support.

## 1. Secure Feature Delivery

### Scenario

A developer needs to implement a feature in an existing codebase, but wants AI assistance without losing structure or review discipline.

### Workflow

1. Install Secure Coding Agent in the repo.
2. Run `/plan` to research the codebase and break the feature into tasks.
3. Run `/code` to delegate implementation to the configured coder.
4. Run `/review` to perform security review with the configured reviewer.
5. Run `/report` for decision-ready output.

### Why it matters

This is the core “developer productivity with guardrails” story.

## 2. Multi-Agent Implementation with Controlled Review

### Scenario

An engineer wants to use multiple model CLIs, but does not want model selection and responsibilities to remain implicit.

### Workflow

1. Define the stack in `.multi-agent.json`.
2. Use `/roles` to inspect or change assignments.
3. Keep planning on Claude Sonnet, coding on Haiku, review on Gemini, and specialist support on Codex.
4. Use checkpoints and rollback to control execution risk.

### Why it matters

The value is not “multiple models”.
The value is **explicit orchestration with role governance**.

## 3. Security Review Workflow

### Scenario

A team wants a structured AI-assisted review stage that complements, rather than replaces, security tooling.

### Workflow

1. Use `/review` for reviewer-driven security review over changed files.
2. Use `/security-review` as the broader, higher-cost workflow when static + AI review is worth it.
3. Use `/report` to translate findings into executive or team-facing output.

### Why it matters

This is where the project becomes more than a generic prompt wrapper.
It demonstrates a workflow-level opinion about how AI and security should interact.
