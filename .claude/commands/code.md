---
description: "Fase 3: Delegar implementación al CLI configurado como 'coder' en .multi-agent.json (default: Haiku 4.5)"
---

Implementa la tarea delegando al CLI configurado como `coder` en `.multi-agent.json`:

$ARGUMENTS

## Proceso

### 0. Checkpoint automático (SIEMPRE primero)

Antes de modificar cualquier archivo, crea un checkpoint:

```bash
git add -A 2>/dev/null
git stash push -m "mca-checkpoint: before-code-$(date +%Y%m%d-%H%M%S)" --include-untracked 2>/dev/null \
  && echo "✅ Checkpoint creado" \
  || echo "⚠️  Sin git — crea backup manual si es necesario"
```

> Si el resultado no es correcto → `/rollback` para volver aquí.

### 1. Lee la configuración del coder

```bash
python3 -c "
import json
with open('.multi-agent.json') as f:
    config = json.load(f)
role = config['roles']['coder']
adapter = config['cli_adapters'][role['cli']]
model_id = adapter['models'].get(role['model'], role['model'])
cmd_template = adapter.get('coder_cmd', 'UNKNOWN')
print(f'Coder CLI: {role[\"cli\"]}')
print(f'Model: {model_id}')
print(f'Subscription: {role[\"subscription\"]}')
print(f'Command template: {cmd_template}')
"
```

### 2. Prepara el contexto completo

El coder no puede pedir más información — proporciona TODO upfront:
- Lee los archivos relevantes con Read/Glob/Grep
- Identifica tipos, interfaces, convenciones, tests existentes
- Determina si hay dependencias entre subtareas (paralelo vs secuencial)

### 3. Construye y ejecuta el comando según CLI configurado

#### Si coder = claude (default: Haiku 4.5)

```bash
CLAUDECODE= claude \
  --model claude-haiku-4-5-20251001 \
  --print \
  --no-session-persistence \
  --permission-mode bypassPermissions \
  -p "CONTEXTO:\n$(head -80 CLAUDE.md)\n\nCONVENCIONES DEL PROYECTO:\n[ejemplos de código relevante]\n\nTAREA:\n[descripción completa]\n\nARCHIVOS A MODIFICAR:\n[contenido actual]\n\nDEFINICIÓN DE DONE:\n[criterio verificable]\n\nSEGURIDAD OBLIGATORIA:\n- shell=False en subprocess\n- Parameterized queries para SQL\n- Nunca hardcodear secrets\n- Typed exceptions, nunca bare except"
```

#### Si coder = codex

```bash
codex --approval-policy auto-edit -q "[descripción completa de la tarea con contexto]"
```

#### Si coder = opencode

```bash
opencode run "[descripción completa de la tarea con contexto]"
```

### 4. Tareas paralelas (solo si no hay dependencias entre archivos)

Envía múltiples Bash calls en el **mismo mensaje** para ejecución paralela.
Cada worker tiene su propio contexto limpio — no contamina la sesión principal.

### 5. Verifica el resultado

- Revisa la salida del worker
- Verifica que los archivos tengan el resultado esperado
- Si el output NO cumple lo solicitado → **`/rollback`** (más barato que corregir con más AI)
- Si cumple → continúa con `/review`
