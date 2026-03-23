---
description: "Phase 3: Delegate implementation to the CLI configured as 'coder' in .multi-agent.json"
---

Implement the task by delegating it to the CLI configured as `coder` in `.multi-agent.json`:

$ARGUMENTS

## Process

### 0. Automatic checkpoint (always first)

Before modifying any file, create a checkpoint:

```bash
git add -A 2>/dev/null
git stash push -m "mca-checkpoint: before-code-$(date +%Y%m%d-%H%M%S)" --include-untracked 2>/dev/null \
  && echo "Checkpoint created" \
  || echo "No git repository detected. Create a manual backup if needed."
```

> If the result is wrong, use `/rollback` immediately.

### 1. Read the coder configuration

```bash
python3 -c "
import json
with open('.multi-agent.json') as f:
    config = json.load(f)
host = config.get('host', 'claude-code')
role = config['roles']['coder']
adapter = config['cli_adapters'][role['cli']]
model_id = adapter['models'].get(role['model'], role['model'])
cmd_template = adapter.get('coder_cmd', 'UNKNOWN')
print(f'Host: {host}')
print(f'Coder CLI: {role[\"cli\"]}')
print(f'Model: {model_id}')
print(f'Subscription: {role[\"subscription\"]}')
print(f'Command template: {cmd_template}')
"
```

### 2. Prepare the full context

The coder cannot ask for more context later, so provide everything up front:
- Read the relevant files with `Read`, `Glob`, and `Grep`
- Identify types, interfaces, conventions, and existing tests
- Decide whether subtasks are dependent or can run in parallel

### 3. Build and run the command for the configured CLI

#### If coder = claude

```bash
CLAUDECODE= claude \
  --model claude-haiku-4-5-20251001 \
  --print \
  --no-session-persistence \
  --permission-mode bypassPermissions \
  -p "CONTEXT:\n$(head -80 CLAUDE.md)\n\nPROJECT CONVENTIONS:\n[relevant code examples]\n\nTASK:\n[complete description]\n\nFILES TO MODIFY:\n[current content]\n\nDEFINITION OF DONE:\n[verifiable success criteria]\n\nMANDATORY SECURITY RULES:\n- shell=False for subprocess calls\n- Parameterized queries for SQL\n- Never hardcode secrets\n- Typed exceptions, never bare except"
```

#### If coder = codex

```bash
codex --approval-policy auto-edit -q "[complete task description with context]"
```

#### If coder = opencode on an OpenCode host (`host = opencode` or `opencode-omo`)

Implement the task in the current OpenCode session instead of spawning a nested `opencode` process.
Use host-native subagents such as `@explore` or `@general` when they improve discovery or parallel read-only work.

#### If coder = opencode on a non-OpenCode host

```bash
opencode run "[complete task description with context]"
```

### 4. Parallel work (only when there are no file dependencies)

Send multiple Bash calls in the same message for real parallel execution.
Each worker has a clean context and does not pollute the main session.

### 5. Verify the result

- Review the worker output
- Confirm the files contain the expected result
- If the output does not meet the request, use `/rollback`
- If it looks correct, continue with `/review`
