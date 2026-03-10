---
description: "Crea un checkpoint del estado actual — úsalo ANTES de que los agentes modifiquen archivos"
---

Crea un checkpoint del estado actual del proyecto para poder hacer `/rollback` si los cambios de los agentes son incorrectos.

$ARGUMENTS (opcional: etiqueta descriptiva del checkpoint, ej: "antes-de-refactor-auth")

## Proceso

### 1. Verifica si es un repo git

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && echo "GIT" || echo "NO_GIT"
```

### 2a. Repo git → git stash (preferido)

El stash no contamina el historial git. Múltiples checkpoints apilados.

```bash
LABEL="${ARGUMENTS:-$(date +%Y%m%d-%H%M%S)}"
git add -A
git stash push -m "mca-checkpoint: $LABEL" --include-untracked
echo "✅ Checkpoint creado: mca-checkpoint: $LABEL"
echo "   Para listar: git stash list | grep mca-checkpoint"
echo "   Para restaurar: /rollback"
```

### 2b. Sin git → copia de archivos

```bash
LABEL="${ARGUMENTS:-$(date +%Y%m%d-%H%M%S)}"
BACKUP_DIR=".multi-agent-checkpoints/$LABEL"
mkdir -p "$BACKUP_DIR"

# Copia todos los archivos tracked (excluye node_modules, .git, etc.)
rsync -a \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.multi-agent-checkpoints/' \
  --exclude='dist/' \
  . "$BACKUP_DIR/"

echo "✅ Checkpoint creado en: $BACKUP_DIR"
echo "   Para restaurar: /rollback"
```

### 3. Registra el checkpoint

```bash
# Guarda metadata para referencia
mkdir -p .multi-agent-checkpoints
cat >> .multi-agent-checkpoints/log.json << EOF
{"timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "label": "$LABEL", "type": "git-stash"}
EOF
```

### 4. Confirma y continúa

Informa al usuario del checkpoint creado. Ahora es seguro ejecutar `/code` o `/full-cycle`.

> ⚠️ **Siempre crea un checkpoint ANTES de delegar a agentes** — es más barato hacer rollback que corregir errores con más prompts de AI.
