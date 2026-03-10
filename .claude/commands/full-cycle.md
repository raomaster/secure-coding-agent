---
description: "Pipeline completo multi-agente con checkpoint automático: plan → code → review → report"
---

Ejecuta el pipeline multi-agente completo con checkpoint automático:

$ARGUMENTS

## Stack actual

Lee `.multi-agent.json` para mostrar qué CLI usa cada rol:
```bash
python3 -c "
import json
with open('.multi-agent.json') as f: c = json.load(f)
r = c['roles']
print(f'  Planner   → {r[\"planner\"][\"cli\"]} ({r[\"planner\"][\"model\"]})')
print(f'  Coder     → {r[\"coder\"][\"cli\"]} ({r[\"coder\"][\"model\"]})')
print(f'  Reviewer  → {r[\"reviewer\"][\"cli\"]} ({r[\"reviewer\"][\"model\"]})')
print(f'  Reporter  → {r[\"reporter\"][\"cli\"]} ({r[\"reporter\"][\"model\"]})')
print(f'  Specialist→ {r[\"specialist\"][\"cli\"]} ({r[\"specialist\"][\"model\"]})')
"
```

> Para cambiar el stack: `/roles` o edita `.multi-agent.json` directamente.

---

## Pipeline

### 🔒 Checkpoint inicial (automático)

```bash
git add -A 2>/dev/null
git stash push -m "mca-checkpoint: full-cycle-start-$(date +%Y%m%d-%H%M%S)" --include-untracked 2>/dev/null \
  && echo "✅ Checkpoint creado — usa /rollback si el resultado no es correcto" \
  || echo "⚠️  Proyecto sin git — considera crear backup manual"
```

---

### Fase 1 — Plan (Planner: Sonnet)

Exploro el codebase, identifico convenciones, creo plan de tareas atómicas.

→ Ver `/plan` para el proceso detallado.

---

### [PAUSA] Confirmación del plan

Presento el plan completo:
- Tareas y su orden (paralelas vs secuenciales)
- CLIs que se usarán para cada fase
- Checkpoint creado en: `git stash list | grep mca-checkpoint | head -1`

¿Procedemos?

---

### Fase 2 — Code (Coder: ver `.multi-agent.json`)

Workers ejecutan las tareas. Tareas sin dependencias → paralelas.

→ Ver `/code` para el proceso detallado.

**Si el resultado no cumple lo esperado → `/rollback` inmediatamente.**

---

### Fase 3 — Review (Reviewer: ver `.multi-agent.json`)

Security review del código implementado: OWASP ASVS 5.0, CWE Top 25 2025.

→ Ver `/review` para el proceso detallado.

**Hallazgos CRITICAL → `/rollback` y replantear.**

---

### Fase 4 — Report (Reporter: ver `.multi-agent.json`)

Reporte ejecutivo del ciclo completo.

→ Ver `/report` para el proceso detallado.

---

## Comandos de control

| Situación | Comando |
|-----------|---------|
| Output incorrecto | `/rollback` |
| Ver checkpoints | `git stash list \| grep mca-checkpoint` |
| Cambiar un rol | `/roles set <rol> <cli> <model>` |
| Checkpoint manual | `/checkpoint <etiqueta>` |
