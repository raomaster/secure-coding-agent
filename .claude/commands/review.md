---
description: "Fase 4: Security review con el CLI configurado como 'reviewer' en .multi-agent.json (default: Gemini 3.1 Pro)"
---

Ejecuta revisión de seguridad usando el CLI configurado como `reviewer`:

$ARGUMENTS (archivos a revisar — sin argumento usa los modificados recientemente)

## Proceso

### 1. Lee la configuración del reviewer

```bash
python3 -c "
import json
with open('.multi-agent.json') as f:
    config = json.load(f)
role = config['roles']['reviewer']
adapter = config['cli_adapters'][role['cli']]
model_id = adapter['models'].get(role['model'], role['model'])
print(f'Reviewer CLI: {role[\"cli\"]}')
print(f'Model: {model_id}')
print(f'Subscription: {role[\"subscription\"]}')
"
```

### 2. Identifica archivos a revisar

```bash
# Si no se especifican en $ARGUMENTS:
git diff --name-only HEAD 2>/dev/null || git status --short 2>/dev/null | awk '{print $2}'
```

### 3. Ejecuta el review según CLI configurado

#### Si reviewer = gemini (default: 3.1 Pro)

```bash
cat [archivos] | gemini -m pro --yolo \
  -p "Eres senior security engineer. Revisa según OWASP ASVS 5.0, CWE Top 25 2025, NIST SSDF.

Formato:
## Security Review Report
| Severity | CWE | Archivo:Línea | Descripción | Fix sugerido |
|----------|-----|---------------|-------------|--------------|

### Resumen: CRITICAL: n, HIGH: n, MEDIUM: n, LOW: n

### Acciones inmediatas (CRITICAL + HIGH):
1. [archivo:línea] — [acción] — Estimado: Xh"

# Archivo grande (> 2000 líneas) — Gemini tiene 2M token context:
cat [archivo_grande] | gemini -m pro --yolo -p "Security review: [aspecto específico]"
```

#### Si reviewer = codex

```bash
codex -q "Security review of these files per OWASP ASVS 5.0 and CWE Top 25 2025.
Report format: | Severity | CWE | File:Line | Description | Fix |
Files: [lista]"
```

#### Si reviewer = claude (modo fallback)

```bash
# Revisar directamente como Sonnet en la sesión actual
# (solo cuando Gemini/Codex no estén disponibles)
```

### 4. Procesa hallazgos

| Severidad | Acción |
|-----------|--------|
| CRITICAL | Rollback si el código implementó algo peligroso → `/rollback`, luego replanificar |
| HIGH | Fix en este sprint → `/fix-findings` |
| MEDIUM | Issue para próximo sprint |
| LOW/INFO | Documentar en `SECURITY_DECISIONS.md` |

### 5. Siguiente paso

- Hallazgos CRITICAL/HIGH → `/fix-findings` o `/rollback` si son graves
- Sin hallazgos críticos → `/report`
