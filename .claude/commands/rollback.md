---
description: "Revierte al checkpoint anterior — cancela cambios de agentes incorrectos"
---

Revierte el proyecto al estado de un checkpoint anterior, descartando los cambios realizados por los agentes.

$ARGUMENTS (opcional: etiqueta o índice del checkpoint — sin argumento muestra la lista)

## Proceso

### 1. Lista los checkpoints disponibles

```bash
echo "=== Checkpoints disponibles ==="

# Git stash checkpoints
if git rev-parse --is-inside-work-tree 2>/dev/null; then
  git stash list | grep "mca-checkpoint" | nl -v 0
else
  # File-based checkpoints
  ls -lt .multi-agent-checkpoints/ 2>/dev/null | grep -v log.json || echo "(sin checkpoints)"
fi
```

### 2. Confirma con el usuario

Muestra los cambios que se PERDERÁN con el rollback:

```bash
# En git: muestra qué archivos cambiarían
git diff --stat 2>/dev/null || echo "(sin cambios pendientes en git)"

# Archivos no trackeados que se eliminarían
git status --short 2>/dev/null | grep "^?" || true
```

**Pide confirmación explícita** antes de ejecutar el rollback. Los cambios NO recuperables se pierden.

### 3a. Rollback git stash

```bash
# Si $ARGUMENTS es un índice (ej: "0", "1")
# → git stash apply stash@{N} o git stash pop stash@{N}

# Rollback al checkpoint más reciente:
git stash pop "stash@{0}"

# Rollback a un checkpoint específico (por índice):
STASH_IDX="${ARGUMENTS:-0}"
git stash pop "stash@{$STASH_IDX}"

echo "✅ Rollback completado al checkpoint: $(git stash list | head -1)"
```

> **Nota**: `pop` restaura Y elimina el checkpoint. Usa `apply` si quieres restaurar pero conservar el checkpoint para referencia.

### 3b. Rollback por etiqueta

```bash
# Buscar checkpoint por etiqueta
LABEL="$ARGUMENTS"
STASH_REF=$(git stash list | grep "mca-checkpoint: $LABEL" | head -1 | cut -d: -f1)

if [[ -n "$STASH_REF" ]]; then
  git stash pop "$STASH_REF"
  echo "✅ Rollback a: $LABEL"
else
  echo "❌ Checkpoint '$LABEL' no encontrado"
  echo "   Checkpoints disponibles:"
  git stash list | grep "mca-checkpoint"
fi
```

### 3c. Rollback file-based (sin git)

```bash
BACKUP_DIR=".multi-agent-checkpoints/${ARGUMENTS:-$(ls -t .multi-agent-checkpoints/ | grep -v log.json | head -1)}"

rsync -a --delete \
  --exclude='.multi-agent-checkpoints/' \
  "$BACKUP_DIR/" \
  .

echo "✅ Rollback desde: $BACKUP_DIR"
```

### 4. Verifica el estado

```bash
git status 2>/dev/null || echo "Estado restaurado"
echo ""
echo "✅ Rollback completo. Estado del proyecto restaurado al checkpoint."
echo "   Si el rollback no fue el correcto, hay más checkpoints disponibles:"
git stash list | grep "mca-checkpoint" | head -5
```

### 5. Siguiente paso

- Analiza por qué los agentes fallaron antes de reintentar
- Ajusta el contexto o las instrucciones en `/plan`
- Crea un nuevo checkpoint con `/checkpoint` antes de intentar de nuevo
- Considera dividir la tarea en partes más pequeñas

---

> 💡 **Filosofía**: Hacer rollback es más barato que corregir errores con más prompts de AI. Cuando el output de los agentes no cumple con lo solicitado, **rollback primero, mejora el plan después**.
