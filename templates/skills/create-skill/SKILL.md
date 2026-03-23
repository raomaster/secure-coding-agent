---
name: create-skill
description: Create or refine reusable project skills using the secure-coding-agent skill contract
compatibility: claude-code,opencode
metadata:
  audience: maintainers
  workflow: skill-authoring
---

## Prerequisites

- Confirm whether the skill should live in `.claude/skills/` or `.opencode/skills/`.
- Inspect neighboring skills before creating a new one.
- Prefer ASCII output unless the repository already uses non-ASCII text intentionally.

## Run Instructions

1. Clarify the skill's purpose, trigger conditions, expected inputs, and expected outputs.
2. Search the repository for similar commands, prompts, agents, or skills that the new skill should align with.
3. Decide the destination folder name using lowercase hyphenated naming.
4. Draft `SKILL.md` with YAML frontmatter and a concise executable body.
5. Use this structure unless the repository already has a stronger local convention:
   - `Prerequisites`
   - `Run Instructions`
   - `Output Format`
   - `Interpret Results`
   - `Common Rules`
   - `Next Steps`
6. Add `scripts/`, `references/`, or `assets/` only when they materially improve execution.
7. If the skill changes existing workflows, update local docs or command references in the same change.

## Output Format

Produce:

- target path for the skill
- final `SKILL.md` content
- optional support files to create
- short rationale for naming and trigger description

The generated skill must:

- start with YAML frontmatter
- use a specific `name` and `description`
- tell the agent exactly when to load it
- avoid vague filler and generic advice
- be executable without extra interpretation

## Interpret Results

After drafting the skill, verify:

1. The directory name matches the skill name.
2. The description is specific enough for an agent to choose correctly.
3. The steps are deterministic and ordered.
4. Any required tools, commands, or files are named explicitly.
5. The skill does not duplicate a stronger existing skill without a clear reason.

If any check fails, revise the draft before finalizing it.

## Common Rules

- Prefer one clear responsibility per skill.
- Keep the skill repo-native and transparent.
- Reuse local terminology from `AGENT_RULES.md`, `CLAUDE.md`, `AGENTS.md`, or adjacent workflow docs.
- When adapting ideas from external skill creators, keep the local output contract and naming conventions.

## Next Steps

- If the skill introduces a new workflow entrypoint, update user-facing docs.
- If the skill is security-sensitive, align it with installed security rules and review expectations.
- If the skill will be reused heavily, consider adding tests, examples, or a paired command later.
