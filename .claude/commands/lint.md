---
description: "[preview] Run the language-appropriate linter: ESLint, Ruff, golangci-lint, Clippy, ShellCheck"
---

# Lint

Detect the project language and run the appropriate linter. No AI, no token cost.

$ARGUMENTS (directory to analyze; defaults to the current directory)

> Preview workflow: this skill is available, but automatic `/full-cycle` integration is still future work.

## Process

### 1. Detect the language

```bash
TARGET="${ARGUMENTS:-.}"

detect_language() {
  [[ -f ".eslintrc*" || -f "eslint.config.*" ]] && echo "javascript" && return
  [[ -f "pyproject.toml" || -f ".ruff.toml" || -f ".pylintrc" ]] && echo "python" && return
  [[ -f ".golangci.yml" || -f "go.mod" ]] && echo "go" && return
  [[ -f "Cargo.toml" ]] && echo "rust" && return
  [[ -f ".rubocop.yml" || -f "Gemfile" ]] && echo "ruby" && return

  ts_count=$(find "$TARGET" -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  py_count=$(find "$TARGET" -name "*.py" 2>/dev/null | wc -l | tr -d ' ')
  go_count=$(find "$TARGET" -name "*.go" 2>/dev/null | wc -l | tr -d ' ')

  [[ $ts_count -gt 0 ]] && echo "javascript" && return
  [[ $py_count -gt 0 ]] && echo "python" && return
  [[ $go_count -gt 0 ]] && echo "go" && return
  echo "unknown"
}

LANG=$(detect_language)
echo "Detected language: $LANG"
```

### 2. Run the linter

#### JavaScript / TypeScript -> ESLint

```bash
npx eslint . --format json --output-file lint-report.json 2>/dev/null || true
npx eslint . --format stylish
```

#### Python -> Ruff (preferred) + Pylint (fallback)

```bash
ruff check "$TARGET" --output-format json > lint-report.json 2>/dev/null \
  || pip install ruff -q && ruff check "$TARGET" --output-format json > lint-report.json

python -m pylint "$TARGET" --output-format json > lint-report.json 2>/dev/null \
  || pip install pylint -q && python -m pylint "$TARGET" --output-format json > lint-report.json
```

#### Go -> golangci-lint

```bash
golangci-lint run --out-format json > lint-report.json 2>/dev/null \
  || brew install golangci-lint && golangci-lint run --out-format json > lint-report.json
```

#### Rust -> Clippy

```bash
cargo clippy --message-format json 2>&1 | tee lint-report.json
```

#### Ruby -> RuboCop

```bash
rubocop --format json --out lint-report.json 2>/dev/null \
  || gem install rubocop && rubocop --format json --out lint-report.json
```

#### Shell scripts -> ShellCheck

```bash
find "$TARGET" -name "*.sh" -print0 | xargs -0 shellcheck --format json > lint-report.json 2>/dev/null \
  || brew install shellcheck && find "$TARGET" -name "*.sh" -print0 | xargs -0 shellcheck --format json > lint-report.json
```

### 3. Analyze the findings

Read `lint-report.json` and present:

```text
## Lint Report

Language: [detected]
Tool: [tool used]
Files analyzed: n

Findings by severity:
  ERROR:   n
  WARNING: n
  INFO:    n

Top issues:
  [file:line] [rule] [description]
  ...

Recommendation: use /lint-fix to address ERROR and WARNING items automatically
```

### 4. Next step

- If there are ERRORs or WARNINGs, use `/lint-fix`
- Then continue with `/sast-scan` or `/review`
