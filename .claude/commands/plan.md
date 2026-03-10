---
description: "Fase 1+2: Research del codebase + plan estructurado de tareas para workers Haiku"
---

Analiza el siguiente requerimiento y crea un plan de implementación:

$ARGUMENTS

## Proceso

### 1. Research
Explora el codebase con tus herramientas antes de planificar:
- `Glob` para encontrar archivos relevantes
- `Grep` para patrones existentes, convenciones, tipos, interfaces
- `Read` para entender implementaciones similares
- Agent tool con `subagent_type="Explore"` si el repo es grande

### 2. Preguntas Clarificadoras
Antes de crear el plan, identifica ambigüedades:
- ¿Qué comportamiento exacto se espera en edge cases?
- ¿Hay restricciones de performance, compatibilidad o breaking changes?
- ¿Qué archivos NO deben modificarse?
- ¿Hay trust boundaries nuevos que analizar?

Presenta las preguntas y espera respuesta antes de continuar.

### 3. Plan Estructurado

Divide en tareas atómicas con este formato:

```
TAREA 1: [título descriptivo]
- Descripción: [qué hacer exactamente]
- Archivos a modificar: [lista completa]
- Dependencias: ninguna | Tarea N
- Paralela con: Tarea N | ninguna (no tocan los mismos archivos)
- Contexto para Haiku: [qué información necesita el worker]
- Definición de done: [criterio verificable]

TAREA 2: ...
```

### 4. Análisis de Seguridad Inicial

Identifica antes de implementar:
- ¿Hay nuevos trust boundaries?
- ¿Se manejan inputs externos (usuario, API, archivo)?
- ¿Se crean nuevas superficies de ataque?
- ¿Se necesita `/threat-model` por cambios arquitectónicos?

### 5. Confirmación

Presenta el plan completo y espera aprobación antes de ejecutar.
Sugiere usar `/code` para implementar o `/full-cycle` para el pipeline completo.
