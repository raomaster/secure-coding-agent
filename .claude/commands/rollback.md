---
description: "Revert to a previous checkpoint"
---

Revert the project to a previous checkpoint and discard the changes produced after it.

$ARGUMENTS (optional: checkpoint label or index; with no argument, show the list)

## Process

### 1. List available checkpoints

```bash
echo "=== Available checkpoints ==="

if git rev-parse --is-inside-work-tree 2>/dev/null; then
  git stash list | grep "mca-checkpoint" | nl -v 0
else
  ls -lt .multi-agent-checkpoints/ 2>/dev/null | grep -v log.json || echo "(no checkpoints)"
fi
```

### 2. Confirm with the user

Show the changes that will be lost:

```bash
git diff --stat 2>/dev/null || echo "(no pending git changes)"
git status --short 2>/dev/null | grep "^?" || true
```

Ask for explicit confirmation before rolling back. Non-recoverable changes will be lost.

### 3a. Git stash rollback

```bash
git stash pop "stash@{0}"

STASH_IDX="${ARGUMENTS:-0}"
git stash pop "stash@{$STASH_IDX}"

echo "Rollback completed to checkpoint: $(git stash list | head -1)"
```

> `pop` restores and removes the checkpoint. Use `apply` instead if you want to keep it.

### 3b. Roll back by label

```bash
LABEL="$ARGUMENTS"
STASH_REF=$(git stash list | grep "mca-checkpoint: $LABEL" | head -1 | cut -d: -f1)

if [[ -n "$STASH_REF" ]]; then
  git stash pop "$STASH_REF"
  echo "Rolled back to: $LABEL"
else
  echo "Checkpoint '$LABEL' was not found"
  echo "Available checkpoints:"
  git stash list | grep "mca-checkpoint"
fi
```

### 3c. File-based rollback (no git)

```bash
BACKUP_DIR=".multi-agent-checkpoints/${ARGUMENTS:-$(ls -t .multi-agent-checkpoints/ | grep -v log.json | head -1)}"

rsync -a --delete \
  --exclude='.multi-agent-checkpoints/' \
  "$BACKUP_DIR/" \
  .

echo "Rollback restored from: $BACKUP_DIR"
```

### 4. Verify the state

```bash
git status 2>/dev/null || echo "State restored"
echo ""
echo "Rollback complete. Project state restored to the selected checkpoint."
echo "If that was not the right checkpoint, more checkpoints may still be available:"
git stash list | grep "mca-checkpoint" | head -5
```

### 5. Next step

- Understand why the agents failed before retrying
- Improve the context or instructions in `/plan`
- Create a new checkpoint with `/checkpoint` before another attempt
- Split the task into smaller pieces if needed

> Rollback is usually cheaper than trying to repair bad AI output with additional prompts. Roll back first, improve the plan second.
