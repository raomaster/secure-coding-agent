# Secure Coding Agent Layer

> Installed by `secure-coding-agent` for OpenCode and oh-my-openagent hosts.
> Baseline security rules come from `AGENT_RULES.md` via `agent-security-policies`.
> Runtime preferences live in `.multi-agent.json`.

---

## Operating Model

Use a security-first workflow with explicit stages:

1. `/plan` for research and task decomposition
2. `/code` for implementation
3. `/review` for security review
4. `/report` for executive output

Before risky changes, prefer `/checkpoint` and be ready to use `/rollback`.

## OpenCode And OmO Guidance

- If `.sisyphus/` exists, treat oh-my-openagent as the native orchestration layer.
- Keep built-in OmO agents intact. Add secure-coding-agent behavior through custom commands, skills, and agents instead of renaming OmO agents.
- For discovery, prefer host-native exploration flows such as OpenCode's `plan` agent, `@explore`, or OmO's built-ins.
- If the user explicitly asks to persist plans or tasks, write secure-coding-agent artifacts to `.secure-coding/`, not `.sisyphus/`.
- If custom OmO agents are installed, use them for their narrow responsibilities: `Valkyrie-Forge`, `Valkyrie-Check`, `Barrier-Review`, and `Archive-Note`.
- The reusable `create-skill` skill should be used when authoring or refining project skills.

## Role Config

`.multi-agent.json` controls the preferred stack:

- `planner`
- `coder`
- `reviewer`
- `reporter`
- `specialist`

For OpenCode hosts, the defaults point to the active OpenCode session.
Use `/roles` to inspect or change the current stack.
Use the `persistence` block in `.multi-agent.json` to decide whether plans or task lists are mirrored into `.secure-coding/`.

## Security Expectations

- Follow `AGENT_RULES.md` and any installed security skills.
- If `Aegis` is present in `.claude/agents/`, treat it as a mandatory security companion.
- Escalate trust-boundary changes, auth flows, secret handling, data exposure, and risky subprocess usage during planning.
