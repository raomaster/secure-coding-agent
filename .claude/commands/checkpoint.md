---
description: "Create a checkpoint before agents modify files"
---

Create a checkpoint of the current project state so you can use `/rollback` if an agent produces the wrong result.

$ARGUMENTS (optional descriptive label, for example: "before-auth-refactor")

## Process

### 1. Check whether this is a git repository

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && echo "GIT" || echo "NO_GIT"
```

### 2a. Git repository -> git stash (preferred)

This keeps checkpoints out of commit history and allows stacking multiple checkpoints.

```bash
LABEL="${ARGUMENTS:-$(date +%Y%m%d-%H%M%S)}"
git add -A
git stash push -m "mca-checkpoint: $LABEL" --include-untracked
echo "Checkpoint created: mca-checkpoint: $LABEL"
echo "List checkpoints: git stash list | grep mca-checkpoint"
echo "Restore with: /rollback"
```

### 2b. No git -> file copy backup

```bash
LABEL="${ARGUMENTS:-$(date +%Y%m%d-%H%M%S)}"
BACKUP_DIR=".multi-agent-checkpoints/$LABEL"
mkdir -p "$BACKUP_DIR"

rsync -a \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.multi-agent-checkpoints/' \
  --exclude='dist/' \
  . "$BACKUP_DIR/"

echo "Checkpoint created in: $BACKUP_DIR"
echo "Restore with: /rollback"
```

### 3. Record checkpoint metadata

```bash
mkdir -p .multi-agent-checkpoints
cat >> .multi-agent-checkpoints/log.json << EOF
{"timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "label": "$LABEL", "type": "git-stash"}
EOF
```

### 4. Confirm and continue

Tell the user which checkpoint was created. It is now safe to run `/code` or `/full-cycle`.

> Always create a checkpoint before delegating work to agents. Rolling back is cheaper than repairing bad output with more AI prompts.
