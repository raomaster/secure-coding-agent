---
description: "Complete security review: parallel scans (Semgrep + Gitleaks + Trivy) plus AI deep review with the configured reviewer"
---

# Security Review

$ARGUMENTS (files, directory, or empty -> use git diff automatically)

## Step 0: Read the agent configuration

Always start here. CLI and model selection comes from `.multi-agent.json`, not from hardcoded assumptions.

```bash
python3 << 'EOF'
import json

with open('.multi-agent.json') as f:
    config = json.load(f)

reviewer = config['roles']['reviewer']
reporter = config['roles']['reporter']
rev_cli   = reviewer['cli']
rev_model = config['cli_adapters'][rev_cli]['models'].get(reviewer['model'], reviewer['model'])
rep_cli   = reporter['cli']
rep_model = config['cli_adapters'][rep_cli]['models'].get(reporter['model'], reporter['model'])

print(f"Reviewer : {rev_cli} / {rev_model}")
print(f"Reporter : {rep_cli} / {rep_model}")
EOF
```

Build the review command dynamically according to the configured CLI:

| `reviewer.cli` | Command shape |
|----------------|---------------|
| `gemini` | `cat content | gemini -m <model> --yolo -p "..."` |
| `codex` | `codex -q "<prompt + file content>"` |
| `claude` | Review directly in the current session |

---

## Step 1: Identify the scope

```bash
rm -f .sr-files.tmp .sr-prompt.tmp .sr-report-prompt.tmp .sr-ai-review.md

if [[ -n "$ARGUMENTS" ]]; then
    SCOPE="$ARGUMENTS"
elif git rev-parse --is-inside-work-tree 2>/dev/null; then
    SCOPE=$(git diff --name-only HEAD 2>/dev/null | tr '\n' ' ')
    [[ -z "$SCOPE" ]] && SCOPE=$(git diff --name-only --cached 2>/dev/null | tr '\n' ' ')
    [[ -z "$SCOPE" ]] && SCOPE="."
else
    SCOPE="."
fi

for entry in $SCOPE; do
    if [[ -f "$entry" ]]; then
        printf "%s\n" "$entry" >> .sr-files.tmp
    elif [[ -d "$entry" ]]; then
        find "$entry" -type f \
          -not -path '*/.git/*' \
          -not -path '*/node_modules/*' \
          -not -path '*/dist/*' >> .sr-files.tmp
    fi
done

sort -u .sr-files.tmp -o .sr-files.tmp 2>/dev/null || true

if [[ ! -s .sr-files.tmp ]]; then
    echo "No files found for review"
    rm -f .sr-files.tmp
    exit 0
fi

echo "Scope (first 20 files):"
sed -n '1,20p' .sr-files.tmp
```

---

## Step 2: Static scans in parallel (no AI, no tokens)

Launch all three at the same time. They are independent and should run in real parallel.

```bash
docker run --rm -v "${PWD}:/src" semgrep/semgrep:latest \
  semgrep scan \
    --config=p/owasp-top-ten \
    --config=p/security-audit \
    --config=p/secrets \
    --json \
    --output=/src/.sr-sast.json \
    /src 2>/dev/null &
SAST_PID=$!

docker run --rm -v "${PWD}:/path" zricethezav/gitleaks:latest \
  detect \
    --source /path \
    --no-git \
    --report-format json \
    --report-path /path/.sr-secrets.json \
    --exit-code 0 2>/dev/null &
SECRETS_PID=$!

docker run --rm -v "${PWD}:/src" aquasec/trivy:latest \
  fs \
    --scanners vuln \
    --format json \
    --output /src/.sr-deps.json \
    /src 2>/dev/null &
DEPS_PID=$!

wait $SAST_PID && echo "SAST completed" || echo "SAST failed"
wait $SECRETS_PID && echo "Secrets scan completed" || echo "Secrets scan failed"
wait $DEPS_PID && echo "Dependency scan completed" || echo "Dependency scan failed"
```

> If Docker is unavailable, install the tools locally and run the equivalent native commands.

---

## Step 3: Consolidate findings from the static scans

Read the JSON reports and extract actionable findings before calling the reviewer:

```bash
python3 << 'EOF'
import json, os

findings = []

if os.path.exists('.sr-sast.json'):
    with open('.sr-sast.json') as f:
        data = json.load(f)
    for r in data.get('results', []):
        sev = r.get('extra', {}).get('severity', 'INFO')
        cwe = r.get('extra', {}).get('metadata', {}).get('cwe', ['CWE-?'])[0]
        findings.append({
            'source': 'SAST/Semgrep',
            'severity': sev,
            'cwe': cwe,
            'file': r.get('path', ''),
            'line': r.get('start', {}).get('line', 0),
            'message': r.get('extra', {}).get('message', '')
        })

if os.path.exists('.sr-secrets.json'):
    try:
        with open('.sr-secrets.json') as f:
            secrets = json.load(f)
        for s in (secrets or []):
            findings.append({
                'source': 'Secrets/Gitleaks',
                'severity': 'ERROR',
                'cwe': 'CWE-798',
                'file': s.get('File', ''),
                'line': s.get('StartLine', 0),
                'message': f"Hardcoded secret: {s.get('RuleID', 'unknown')}"
            })
    except Exception:
        pass

if os.path.exists('.sr-deps.json'):
    with open('.sr-deps.json') as f:
        data = json.load(f)
    for result in data.get('Results', []):
        for vuln in result.get('Vulnerabilities', []):
            sev = vuln.get('Severity', 'UNKNOWN')
            findings.append({
                'source': 'Deps/Trivy',
                'severity': sev,
                'cwe': vuln.get('VulnerabilityID', ''),
                'file': result.get('Target', ''),
                'line': 0,
                'message': f"{vuln.get('PkgName','')} {vuln.get('InstalledVersion','')} -> {vuln.get('FixedVersion','no fix')}"
            })

order = {'CRITICAL': 0, 'ERROR': 0, 'HIGH': 1, 'WARNING': 1, 'MEDIUM': 2, 'LOW': 3, 'INFO': 4, 'UNKNOWN': 5}
findings.sort(key=lambda x: order.get(x['severity'].upper(), 5))

print(f"\nTotal findings: {len(findings)}")
print(f"  CRITICAL/ERROR: {sum(1 for f in findings if f['severity'].upper() in ('CRITICAL','ERROR'))}")
print(f"  HIGH/WARNING  : {sum(1 for f in findings if f['severity'].upper() in ('HIGH','WARNING'))}")
print(f"  MEDIUM        : {sum(1 for f in findings if f['severity'].upper() == 'MEDIUM')}")
print(f"  LOW/INFO      : {sum(1 for f in findings if f['severity'].upper() in ('LOW','INFO'))}")

with open('.sr-consolidated.json', 'w') as f:
    json.dump(findings, f, indent=2)
EOF
```

---

## Step 4: AI deep review

The reviewer should focus on what scanners do not reliably detect:
- broken authentication or authorization logic
- race conditions and TOCTOU issues
- business logic vulnerabilities
- control bypasses from valid inputs used in dangerous combinations
- session and token lifecycle problems
- error handling that leaks internal state
- SSRF, XXE, and unsafe deserialization in non-trivial flows
- privilege escalation from call sequencing

Build the prompt and run the configured reviewer:

```bash
eval "$(python3 << 'EOF'
import json, shlex

with open('.multi-agent.json') as f:
    config = json.load(f)

reviewer = config['roles']['reviewer']
reporter = config['roles']['reporter']
reviewer_adapter = config['cli_adapters'][reviewer['cli']]
reporter_adapter = config['cli_adapters'][reporter['cli']]

reviewer_model = reviewer_adapter['models'].get(reviewer['model'], reviewer['model'])
reporter_model = reporter_adapter['models'].get(reporter['model'], reporter['model'])

print(f"REVIEWER_CLI={shlex.quote(reviewer['cli'])}")
print(f"REVIEWER_MODEL={shlex.quote(reviewer_model)}")
print(f"REPORTER_CLI={shlex.quote(reporter['cli'])}")
print(f"REPORTER_MODEL={shlex.quote(reporter_model)}")
EOF
)"

TOP_FINDINGS="$(python3 << 'EOF'
import json, os

if not os.path.exists('.sr-consolidated.json'):
    raise SystemExit(0)

with open('.sr-consolidated.json') as f:
    findings = json.load(f)

for finding in findings[:10]:
    print(f"{finding['severity']} {finding['cwe']} {finding['file']}:{finding['line']} - {finding['message']}")
EOF
)"

cat > .sr-prompt.tmp <<EOF
You are a senior security engineer. Semgrep, Gitleaks, and Trivy have already run.
Your job is to detect what static tools often miss: auth/authz logic flaws, race conditions,
business logic vulnerabilities, control bypasses, incorrect session or token handling, and
privilege escalation.

Standards: OWASP ASVS 5.0 (V2 Auth, V3 Session, V4 Access Control, V5 Input Validation),
CWE/SANS Top 25 2025, NIST SSDF 1.1.

Findings already reported by scanners (do not repeat them):
$TOP_FINDINGS

Response format:
## AI Security Review
| Severity | CWE | File:Line | Description | Fix |
|----------|-----|-----------|-------------|-----|

### Critical findings with complete fix guidance
[before code -> after code for CRITICAL and HIGH]

### Final summary: CRITICAL: n, HIGH: n, MEDIUM: n, LOW: n
EOF

case "$REVIEWER_CLI" in
  gemini)
    while IFS= read -r file; do
      printf '\n===== %s =====\n' "$file"
      cat "$file"
    done < .sr-files.tmp | gemini -m "$REVIEWER_MODEL" --yolo -p "$(cat .sr-prompt.tmp)" | tee .sr-ai-review.md
    ;;
  codex)
    {
      cat .sr-prompt.tmp
      printf '\n\nFiles:\n'
      while IFS= read -r file; do
        printf '\n===== %s =====\n' "$file"
        cat "$file"
      done < .sr-files.tmp
    } > .sr-ai-input.tmp
    codex -q "$(cat .sr-ai-input.tmp)" | tee .sr-ai-review.md
    rm -f .sr-ai-input.tmp
    ;;
  claude)
    echo "Reviewer is set to Claude. Perform the review in the current session using Read on .sr-files.tmp."
    ;;
  *)
    echo "Unsupported reviewer.cli for /security-review: $REVIEWER_CLI"
    ;;
esac
```

---

## Step 5: Executive report

```bash
ALL_FINDINGS=$(cat .sr-consolidated.json .sr-ai-review.md 2>/dev/null)

cat > .sr-report-prompt.tmp <<'EOF'
Generate an executive security report in markdown.
Status: CRITICAL / HIGH / MEDIUM / CLEAN.
Include: executive summary, top 3 immediate actions with effort estimate,
metrics by source (SAST / Secrets / Dependencies / AI), and a remediation roadmap.
EOF

case "$REPORTER_CLI" in
  gemini)
    echo "$ALL_FINDINGS" | gemini -m "$REPORTER_MODEL" --yolo -p "$(cat .sr-report-prompt.tmp)"
    ;;
  codex)
    codex -q "$ALL_FINDINGS

$(cat .sr-report-prompt.tmp)"
    ;;
  claude)
    echo "Reporter is set to Claude. Generate the report in the current session using .sr-consolidated.json and .sr-ai-review.md."
    ;;
  *)
    echo "Unsupported reporter.cli for /security-review: $REPORTER_CLI"
    ;;
esac
```

---

## Step 6: Cleanup and next step

```bash
rm -f .sr-files.tmp .sr-prompt.tmp .sr-report-prompt.tmp .sr-sast.json .sr-secrets.json .sr-deps.json .sr-consolidated.json
```

- If there are CRITICAL or HIGH findings, use `/fix-findings` or `/rollback` if they came from the latest agent cycle
- If there are no critical findings, the code is ready for merge
- Document false positives in `SECURITY_DECISIONS.md`
