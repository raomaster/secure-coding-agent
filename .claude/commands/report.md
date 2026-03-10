---
description: "Reporte ejecutivo con el CLI configurado como 'reporter' en .multi-agent.json (default: Gemini Flash)"
---

Genera un reporte ejecutivo usando el CLI configurado como `reporter`:

$ARGUMENTS

## Proceso

### 1. Lee la configuración del reporter

```bash
python3 -c "
import json
with open('.multi-agent.json') as f:
    config = json.load(f)
role = config['roles']['reporter']
adapter = config['cli_adapters'][role['cli']]
model_id = adapter['models'].get(role['model'], role['model'])
print(f'Reporter CLI: {role[\"cli\"]} / model: {model_id}')
"
```

### 2. Recopila hallazgos

Lee los reportes existentes o el contexto de la sesión:
```bash
ls *-report.json security-report-*.md threat-model-*.md 2>/dev/null || echo "(usar hallazgos del contexto)"
```

### 3. Genera el reporte según CLI configurado

#### Si reporter = gemini (default: Flash)

```bash
cat [hallazgos] | gemini -m flash --yolo \
  -p "Genera reporte ejecutivo en markdown:

## Executive Summary
**Proyecto**: [detectar] | **Fecha**: $(date +%Y-%m-%d)
**Estado**: 🔴 CRÍTICO | 🟠 ALTO | 🟡 MEDIO | 🟢 BAJO

### Resumen
[2-3 líneas]

### Top 3 Acciones Inmediatas
1. **[hallazgo]** — Fix: [acción]

### Métricas
- Hallazgos: CRITICAL: n · HIGH: n · MEDIUM: n · LOW: n
- Deuda técnica: Xh

### Roadmap
| Plazo | Scope | Esfuerzo |
|-------|-------|----------|
| Inmediato | CRITICAL | Xh |
| Sprint +1 | HIGH | Xh |"
```

#### Si reporter = codex

```bash
codex -q "Generate executive security report in markdown from these findings: [hallazgos]"
```

### 4. Guarda el reporte

```bash
# Guarda en el proyecto
date_str=$(date +%Y%m%d)
# Contenido del reporte → security-report-$date_str.md
```
