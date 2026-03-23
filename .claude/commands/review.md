---
description: "Phase 4: AI security review using the reviewer configured in .multi-agent.json"
---

Run a security review with the reviewer configured in `.multi-agent.json`:

$ARGUMENTS (files to review; with no argument, use files changed since the last commit)

## Process

### 1. Read the reviewer configuration

```bash
python3 << 'EOF'
import json

with open('.multi-agent.json') as f:
    config = json.load(f)

host    = config.get('host', 'claude-code')
role    = config['roles']['reviewer']
adapter = config['cli_adapters'][role['cli']]
model   = adapter['models'].get(role['model'], role['model'])
cli     = role['cli']

print(f"Host     : {host}")
print(f"Reviewer : {cli} / {model}  [{role['subscription']}]")
EOF
```

### 2. Identify files

If `.secure-coding/plan.md` or `.secure-coding/tasks.md` exists, read them as extra review context before reviewing code changes.

```bash
rm -f .review-files.tmp .review-prompt.tmp

if [[ -n "$ARGUMENTS" ]]; then
  SCOPE="$ARGUMENTS"
elif git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  SCOPE="$(git diff --name-only HEAD 2>/dev/null | tr '\n' ' ')"
  [[ -z "$SCOPE" ]] && SCOPE="$(git diff --name-only --cached 2>/dev/null | tr '\n' ' ')"
  [[ -z "$SCOPE" ]] && SCOPE="."
else
  SCOPE="."
fi

for entry in $SCOPE; do
  if [[ -f "$entry" ]]; then
    printf "%s\n" "$entry" >> .review-files.tmp
  elif [[ -d "$entry" ]]; then
    find "$entry" -type f \
      -not -path '*/.git/*' \
      -not -path '*/node_modules/*' \
      -not -path '*/dist/*' >> .review-files.tmp
  fi
done

sort -u .review-files.tmp -o .review-files.tmp 2>/dev/null || true

if [[ ! -s .review-files.tmp ]]; then
  echo "No files found for review"
  rm -f .review-files.tmp
  exit 0
fi

echo "Files to review:"
sed -n '1,20p' .review-files.tmp
```

### 3. Run the review

```bash
eval "$(python3 << 'EOF'
import json, shlex

with open('.multi-agent.json') as f:
    config = json.load(f)

host = config.get('host', 'claude-code')
role = config['roles']['reviewer']
adapter = config['cli_adapters'][role['cli']]
model = adapter['models'].get(role['model'], role['model'])

print(f"HOST={shlex.quote(host)}")
print(f"REVIEWER_CLI={shlex.quote(role['cli'])}")
print(f"REVIEWER_MODEL={shlex.quote(model)}")
EOF
)"

cat > .review-prompt.tmp <<'EOF'
You are a senior security engineer. Review this code against:
- OWASP ASVS 5.0 (V2 Auth, V3 Session, V4 Access Control, V5 Input Validation, V6 Crypto)
- CWE/SANS Top 25 2025
- NIST SSDF 1.1

Response format:
## Security Review Report
| Severity | CWE | File:Line | Description | Suggested Fix |
|----------|-----|-----------|-------------|---------------|

### Summary: CRITICAL: n, HIGH: n, MEDIUM: n, LOW: n

### Immediate Actions (CRITICAL + HIGH)
1. [file:line] — [concrete action] — Estimate: Xh
EOF

case "$REVIEWER_CLI" in
  gemini)
    while IFS= read -r file; do
      printf '\n===== %s =====\n' "$file"
      cat "$file"
    done < .review-files.tmp | gemini -m "$REVIEWER_MODEL" --yolo -p "$(cat .review-prompt.tmp)"
    ;;
  codex)
    {
      cat .review-prompt.tmp
      printf '\n\nFiles:\n'
      while IFS= read -r file; do
        printf '\n===== %s =====\n' "$file"
        cat "$file"
      done < .review-files.tmp
    } > .review-input.tmp
    codex -q "$(cat .review-input.tmp)"
    rm -f .review-input.tmp
    ;;
  claude)
    echo "Reviewer is set to Claude. Perform the review in the current session using Read on .review-files.tmp."
    ;;
  opencode)
    if [[ "$HOST" == "opencode" || "$HOST" == "opencode-omo" ]]; then
      echo "Reviewer is set to OpenCode. Perform the review in the current host session using .review-files.tmp and the prompt in .review-prompt.tmp."
      echo "If available, use @barrier-review for final risk review and Aegis for security-sensitive findings."
    else
      {
        cat .review-prompt.tmp
        printf '\n\nFiles:\n'
        while IFS= read -r file; do
          printf '\n===== %s =====\n' "$file"
          cat "$file"
        done < .review-files.tmp
      } > .review-input.tmp
      opencode run "$(cat .review-input.tmp)"
      rm -f .review-input.tmp
    fi
    ;;
  *)
    echo "Unsupported reviewer.cli for /review: $REVIEWER_CLI"
    ;;
esac

rm -f .review-files.tmp .review-prompt.tmp
```

### 4. Triage

| Severity | Action |
|----------|--------|
| CRITICAL | Use `/rollback` if the code came from agents and rethink the approach |
| HIGH | Use `/fix-findings` before continuing |
| MEDIUM | Create an issue for the next sprint |
| LOW/INFO | Document it in `SECURITY_DECISIONS.md` |

### 5. Next step

- CRITICAL or HIGH findings -> `/fix-findings` or `/rollback`
- No critical findings -> `/report`
- For deeper review (SAST + secrets + deps + AI) -> `/security-review`
