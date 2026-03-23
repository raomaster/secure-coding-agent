---
description: "Show and manage the multi-agent role stack"
---

Show the current role configuration and optionally change which CLI each role uses.

$ARGUMENTS (optional: "set <role> <cli> <model>")

## Process

### Show current roles

Read `.multi-agent.json` and display the active stack:

```bash
cat .multi-agent.json | python3 -c "
import json, sys
config = json.load(sys.stdin)
host = config.get('host', 'claude-code')
roles = config['roles']
adapters = config['cli_adapters']

print('\nCurrent multi-agent stack:\n')
print(f'  {"host":<12} -> {host}')
for role, cfg in roles.items():
    cli = cfg['cli']
    model_alias = cfg['model']
    model_id = adapters.get(cli, {}).get('models', {}).get(model_alias, model_alias)
    sub = cfg['subscription']
    print(f'  {role:<12} -> {cli:<16} model: {model_id:<30} [{sub}]')

print('\nAvailable CLIs:')
for cli, adapter in adapters.items():
    print(f'  {cli:<18} {adapter[\"description\"]}')
print()
"
```

### Change a role

If `$ARGUMENTS` contains `set <role> <cli> <model>`:

```bash
python3 << 'EOF'
import json, sys

args = "$ARGUMENTS".split()
if len(args) >= 4 and args[0] == "set":
    _, role, cli, model = args[0], args[1], args[2], args[3]

    with open(".multi-agent.json", "r") as f:
        config = json.load(f)

    if role not in config["roles"]:
        print(f"Unknown role: {role}")
        print(f"Valid roles: {list(config['roles'].keys())}")
        sys.exit(1)

    if cli not in config["cli_adapters"]:
        print(f"Unknown CLI: {cli}")
        print(f"Available CLIs: {list(config['cli_adapters'].keys())}")
        sys.exit(1)

    old_cli = config["roles"][role]["cli"]
    old_model = config["roles"][role]["model"]
    config["roles"][role]["cli"] = cli
    config["roles"][role]["model"] = model

    with open(".multi-agent.json", "w") as f:
        json.dump(config, f, indent=2)

    print(f"Role '{role}' updated:")
    print(f"  Before: {old_cli} ({old_model})")
    print(f"  After : {cli} ({model})")
    print("\nInstalled workflow commands such as /code and /review will use the new CLI automatically.")
EOF
```

## Quick commands

```bash
/roles
/roles set coder codex o4-mini
/roles set reviewer gemini flash
/roles set reviewer codex o3
/roles set coder claude haiku
```

## How the skills use this config

All pipeline skills (`/code`, `/review`, `/report`) read `.multi-agent.json` to build the correct command dynamically.

Changing a role here updates all dependent skills without any further file edits.

## CLI compatibility by role

| CLI | Coder | Reviewer | Reporter | Notes |
|-----|-------|----------|----------|-------|
| `claude` | yes, haiku/sonnet | no | no | Requires `CLAUDECODE=` for spawning |
| `gemini` | no | yes, pro | yes, flash | 2M context, token caching |
| `codex` | yes, o4-mini/o3 | yes, o3 | no | ChatGPT Plus/Pro |
| `github-copilot` | limited | no | no | Shell suggestions only |
| `opencode` | yes, auto | yes, auto | yes, auto | Uses the active OpenCode host when `host` is `opencode` or `opencode-omo` |
