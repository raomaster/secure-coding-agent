---
description: "Full multi-agent pipeline with automatic checkpoint: plan -> code -> review -> report"
---

Run the full multi-agent pipeline with an automatic checkpoint:

$ARGUMENTS

## Current stack

Read `.multi-agent.json` to show which CLI each role uses:

```bash
python3 -c "
import json
with open('.multi-agent.json') as f: c = json.load(f)
r = c['roles']
print(f'  Host      -> {c.get("host", "claude-code")}')
print(f'  Planner   -> {r[\"planner\"][\"cli\"]} ({r[\"planner\"][\"model\"]})')
print(f'  Coder     -> {r[\"coder\"][\"cli\"]} ({r[\"coder\"][\"model\"]})')
print(f'  Reviewer  -> {r[\"reviewer\"][\"cli\"]} ({r[\"reviewer\"][\"model\"]})')
print(f'  Reporter  -> {r[\"reporter\"][\"cli\"]} ({r[\"reporter\"][\"model\"]})')
print(f'  Specialist-> {r[\"specialist\"][\"cli\"]} ({r[\"specialist\"][\"model\"]})')
"
```

> To change the stack, use `/roles` or edit `.multi-agent.json` directly.

---

## Pipeline

### Initial checkpoint (automatic)

```bash
git add -A 2>/dev/null
git stash push -m "mca-checkpoint: full-cycle-start-$(date +%Y%m%d-%H%M%S)" --include-untracked 2>/dev/null \
  && echo "Checkpoint created. Use /rollback if the result is wrong." \
  || echo "Project is not using git. Consider creating a manual backup."
```

---

### Phase 1: Plan (Planner: see `.multi-agent.json`)

Explore the codebase, identify conventions, and create an atomic task plan.

See `/plan` for the detailed process.

---

### Pause: plan confirmation

Present the full plan:
- tasks and execution order (parallel vs sequential)
- which CLIs will be used in each phase
- the created checkpoint reference from `git stash list | grep mca-checkpoint | head -1`

Wait for confirmation before proceeding.

---

### Phase 2: Code (Coder: see `.multi-agent.json`)

Workers implement the tasks. Independent tasks can run in parallel.

See `/code` for the detailed process.

**If the result does not match the request, use `/rollback` immediately.**

---

### Phase 3: Review (Reviewer: see `.multi-agent.json`)

Run a security review of the implementation against OWASP ASVS 5.0 and CWE Top 25 2025.

See `/review` for the detailed process.

**If there are CRITICAL findings, roll back and rethink the approach.**

---

### Phase 4: Report (Reporter: see `.multi-agent.json`)

Generate an executive summary of the full cycle.

See `/report` for the detailed process.

---

## Control commands

| Situation | Command |
|-----------|---------|
| Incorrect output | `/rollback` |
| List checkpoints | `git stash list \| grep mca-checkpoint` |
| Change one role | `/roles set <role> <cli> <model>` |
| Manual checkpoint | `/checkpoint <label>` |
