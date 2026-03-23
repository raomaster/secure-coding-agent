---
description: "Generate an executive report with the CLI configured as 'reporter' in .multi-agent.json"
---

Generate an executive report using the CLI configured as `reporter`:

$ARGUMENTS

## Process

### 1. Read the reporter configuration

```bash
python3 -c "
import json
with open('.multi-agent.json') as f:
    config = json.load(f)
host = config.get('host', 'claude-code')
role = config['roles']['reporter']
adapter = config['cli_adapters'][role['cli']]
model_id = adapter['models'].get(role['model'], role['model'])
print(f'Host: {host}')
print(f'Reporter CLI: {role[\"cli\"]} / model: {model_id}')
"
```

### 2. Gather findings

Read existing reports or use the current session context:

```bash
ls *-report.json security-report-*.md threat-model-*.md 2>/dev/null || echo "(use findings from the current context)"
```

If `.secure-coding/plan.md` or `.secure-coding/tasks.md` exists, use them to frame the report around the intended scope and completed work.

### 3. Generate the report using the configured CLI

#### If reporter = gemini

```bash
cat [findings] | gemini -m flash --yolo \
  -p "Generate an executive markdown report:

## Executive Summary
**Project**: [detect automatically] | **Date**: $(date +%Y-%m-%d)
**Status**: CRITICAL | HIGH | MEDIUM | LOW

### Summary
[2-3 lines]

### Top 3 Immediate Actions
1. **[finding]** — Fix: [action]

### Metrics
- Findings: CRITICAL: n · HIGH: n · MEDIUM: n · LOW: n
- Technical debt: Xh

### Roadmap
| Timeline | Scope | Effort |
|----------|-------|--------|
| Immediate | CRITICAL | Xh |
| Sprint +1 | HIGH | Xh |"
```

#### If reporter = codex

```bash
codex -q "Generate an executive security report in markdown from these findings: [findings]"
```

#### If reporter = opencode on an OpenCode host (`host = opencode` or `opencode-omo`)

Generate the report in the current OpenCode session using the current findings and save it as `security-report-YYYYMMDD.md`.

#### If reporter = opencode on a non-OpenCode host

```bash
opencode run "Generate an executive security report in markdown from these findings: [findings]"
```

### 4. Save the report

```bash
date_str=$(date +%Y%m%d)
# Save the generated content as security-report-$date_str.md
```
