---
description: "[v0.2.0 preview] Lint con la herramienta adecuada al lenguaje detectado — ESLint, Ruff, golangci-lint, Clippy, ShellCheck"
---

# Lint

Detecta el lenguaje del proyecto y ejecuta el linter apropiado. Sin AI — rápido y sin costo de tokens.

$ARGUMENTS (directorio a analizar — default: directorio actual)

> ⚠️ **v0.2.0 preview**: Este skill está disponible pero la integración automática con el pipeline `/full-cycle` llega en v0.2.0.

## Proceso

### 1. Detecta el lenguaje

```bash
TARGET="${ARGUMENTS:-.}"

detect_language() {
  # Prioridad: archivo de config del linter > extensiones de archivo
  [[ -f ".eslintrc*" || -f "eslint.config.*" ]] && echo "javascript" && return
  [[ -f "pyproject.toml" || -f ".ruff.toml" || -f ".pylintrc" ]] && echo "python" && return
  [[ -f ".golangci.yml" || -f "go.mod" ]] && echo "go" && return
  [[ -f "Cargo.toml" ]] && echo "rust" && return
  [[ -f ".rubocop.yml" || -f "Gemfile" ]] && echo "ruby" && return

  # Fallback: extensiones más comunes
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

### 2. Ejecuta el linter

#### JavaScript / TypeScript → ESLint

```bash
# Con config existente del proyecto:
npx eslint . --format json --output-file lint-report.json 2>/dev/null || true
npx eslint . --format stylish  # output legible para el usuario

# Si no hay config:
npx eslint . --rule '{"no-console":1,"no-unused-vars":2}' --format stylish
```

#### Python → Ruff (preferido) + Pylint (fallback)

```bash
# Ruff (más rápido, reemplaza flake8 + isort + pyupgrade):
ruff check "$TARGET" --output-format json > lint-report.json 2>/dev/null \
  || pip install ruff -q && ruff check "$TARGET" --output-format json > lint-report.json

# Pylint como fallback:
python -m pylint "$TARGET" --output-format json > lint-report.json 2>/dev/null \
  || pip install pylint -q && python -m pylint "$TARGET" --output-format json > lint-report.json
```

#### Go → golangci-lint

```bash
golangci-lint run --out-format json > lint-report.json 2>/dev/null \
  || brew install golangci-lint && golangci-lint run --out-format json > lint-report.json
```

#### Rust → Clippy

```bash
cargo clippy --message-format json 2>&1 | tee lint-report.json
```

#### Ruby → RuboCop

```bash
rubocop --format json --out lint-report.json 2>/dev/null \
  || gem install rubocop && rubocop --format json --out lint-report.json
```

#### Shell scripts → ShellCheck

```bash
find "$TARGET" -name "*.sh" -print0 | xargs -0 shellcheck --format json > lint-report.json 2>/dev/null \
  || brew install shellcheck && find "$TARGET" -name "*.sh" -print0 | xargs -0 shellcheck --format json > lint-report.json
```

### 3. Analiza los hallazgos

Lee `lint-report.json` y presenta:

```
## Lint Report

Language: [detectado]
Tool: [herramienta usada]
Files analyzed: n

Findings by severity:
  ERROR:   n  (bloquean CI)
  WARNING: n  (degradan calidad)
  INFO:    n  (estilo)

Top issues:
  [archivo:línea] [regla] [descripción]
  ...

Recommendation: use /lint-fix to fix ERROR and WARNING automatically
```

### 4. Siguiente paso

- Si hay ERRORs o WARNINGs → usa `/lint-fix` para delegarlos a Haiku
- Luego continúa con `/sast-scan` o `/review`
