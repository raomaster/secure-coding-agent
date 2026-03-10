# Secure Coding Agent

Capa de orquestación multi-agente para suscripciones de AI — sin API keys.

Funciona **sobre** [agent-security-policies](https://github.com/raomaster/agent-security-policies/tree/feature/cli), añadiendo el pipeline de roles encima de las reglas de seguridad.

```
Capa 1: npx agent-security-policies  →  AGENT_RULES.md + CLAUDE.md + AGENTS.md + skills de seguridad
Capa 2: npx secure-coding-agent      →  orquestación multi-agente + GEMINI.md + skills de pipeline
```

---

## Stack

| Rol | Modelo | Suscripción | Archivo de instrucciones |
|-----|--------|-------------|--------------------------|
| 🧠 **Planner** | Claude Sonnet 4.6 | Claude Pro | `CLAUDE.md` (auto-cargado) |
| ⚡ **Coder** | Claude Haiku 4.5 | Claude Pro | `CLAUDE.md` (spawned) |
| 🔍 **Reviewer** | Gemini 3.1 Pro | Google One AI Premium | `GEMINI.md` (auto-cargado) |
| 📊 **Reporter** | Gemini Flash | Google One AI Premium | `GEMINI.md` (auto-cargado) |
| 🤖 **Specialist** | Codex o4-mini | ChatGPT Plus/Pro | `AGENTS.md` (auto-cargado) |

---

## Instalación

### Prerequisitos

```bash
# Claude Code (Claude Pro)
npm i -g @anthropic-ai/claude-code

# Gemini CLI (Google One AI Premium)
npm i -g @google/gemini-cli
gemini auth login

# Codex CLI (ChatGPT Plus)
npm i -g @openai/codex
codex  # → "Sign in with ChatGPT"
```

### Desde npm

```bash
# Ejecutar sin instalar globalmente
npx secure-coding-agent --target /path/to/tu-proyecto

# O instalar globalmente
npm i -g secure-coding-agent
secure-coding-agent --target /path/to/tu-proyecto
```

### Desde el repo

```bash
git clone https://github.com/raomaster/secure-coding-agent.git
cd secure-coding-agent

# Instala ambas capas en el proyecto
./install.sh /path/to/tu-proyecto

# Con MCP servers (filesystem + memory)
./install.sh --mcp /path/to/tu-proyecto

# Solo capa de orquestación (si ya tienes agent-security-policies instalado)
./install.sh --no-security /path/to/tu-proyecto
```

### Qué instala cada capa

**Capa 1** (`npx agent-security-policies --agent claude,codex,antigravity --skills`):
- `AGENT_RULES.md` — reglas de seguridad completas (OWASP ASVS 5.0, CWE Top 25, NIST SSDF)
- `CLAUDE.md` — instrucciones de seguridad para Claude
- `AGENTS.md` — instrucciones de seguridad para Codex
- `.agent/rules/security.md` — reglas para Gemini (formato antigravity)
- `.claude/commands/` — 7 skills de seguridad: `/sast-scan`, `/secrets-scan`, `/dependency-scan`, `/container-scan`, `/iac-scan`, `/threat-model`, `/fix-findings`
- `policies/` — YAML: owasp_asvs.yaml, cwe_top25.yaml, llm_security.yaml, owasp_masvs.yaml

**Capa 2** (este repo):
- `CLAUDE.md` ← **append**: protocolo de orquestación multi-agente
- `GEMINI.md` — rol de reviewer/reporter (no existe en capa 1)
- `.claude/commands/plan.md` — pipeline: Fase 1+2 research + plan
- `.claude/commands/code.md` — pipeline: Fase 3 delegar a Haiku
- `.claude/commands/review.md` — pipeline: Fase 4 revisión Gemini Pro
- `.claude/commands/report.md` — reporte ejecutivo Gemini Flash
- `.claude/commands/full-cycle.md` — pipeline completo end-to-end

---

## Cómo Funciona el Pipeline

```
Tu petición en Claude Code
         ↓
  /full-cycle "implementar X"
         ↓
  Sonnet 4.6 — Planner
  ├── Explora codebase (Glob/Grep/Read)
  ├── Hace preguntas clarificadoras
  └── Crea plan de tareas atómicas
         ↓
  [confirmación del usuario]
         ↓
  Haiku 4.5 × N — Coder (workers paralelos)
  └── CLAUDECODE= claude --model haiku --print ...
         ↓
  Gemini 3.1 Pro — Reviewer
  └── cat archivos | gemini -m pro --yolo -p "security review..."
         ↓
  Gemini Flash — Reporter
  └── echo hallazgos | gemini -m flash --yolo -p "executive report..."
```

### Por qué Haiku para código

- Mucho más barato en Claude Pro que Sonnet
- Workers paralelos con contexto limpio = no contamina la sesión principal
- Ideal para tasks bien definidas con contexto completo

### Por qué Gemini para revisión

- 2M token context = analiza codebases completos
- Token caching activo = `GEMINI.md` + `AGENT_RULES.md` se cachean
- Perspectiva independiente de Claude

---

## Skills Disponibles en Claude Code

### Pipeline Multi-Agente (este repo)
| Comando | Descripción |
|---------|-------------|
| `/plan` | Research del codebase + plan estructurado de tareas |
| `/code` | Delegar implementación a Haiku worker(s) |
| `/review` | Security review con Gemini 3.1 Pro |
| `/report` | Reporte ejecutivo con Gemini Flash |
| `/full-cycle` | Pipeline completo plan→code→review→report |

### Seguridad (agent-security-policies)
| Comando | Herramienta |
|---------|-------------|
| `/sast-scan` | Semgrep — vulnerabilidades CWE en código |
| `/secrets-scan` | Gitleaks — credentials hardcodeadas |
| `/dependency-scan` | Trivy fs — CVEs en dependencias |
| `/container-scan` | Trivy image — CVEs en Docker |
| `/iac-scan` | KICS — misconfigs Terraform/K8s/etc. |
| `/threat-model` | Gemini Pro — STRIDE threat modeling |
| `/fix-findings` | Remediación de hallazgos |

---

## Estructura de Este Repo

```
secure-coding-agent/
├── CLAUDE.md                  # Append: protocolo de orquestación multi-agente
├── GEMINI.md                  # Rol reviewer/reporter para Gemini CLI
├── install.sh                 # Instala ambas capas en cualquier proyecto
├── .claude/
│   ├── settings.json          # MCP: filesystem + memory (con --mcp)
│   └── commands/              # Solo skills de pipeline (seguridad → agent-security-policies)
│       ├── plan.md
│       ├── code.md
│       ├── review.md
│       ├── report.md
│       └── full-cycle.md
└── README.md
```

---

## MCP (Model Context Protocol)

Con `--mcp`, se instala `.claude/settings.json` con:
- **filesystem** MCP server — operaciones de archivo mejoradas
- **memory** MCP server — memoria compartida entre sesiones de agentes

Tanto Claude Code como Gemini CLI son clientes MCP — puedes agregar servidores MCP adicionales para compartir contexto entre agentes.

---

## Próximos Pasos / Roadmap

- [ ] MCP server de seguridad (wrapping Semgrep/Trivy/Gitleaks) para Gemini y Claude
- [ ] Soporte para Codex CLI más profundo cuando madure su MCP
- [ ] GitHub Actions workflow usando el stack completo
- [ ] Cache compartido entre agentes via MCP memory server

---

## Créditos

- Security policies: [agent-security-policies](https://github.com/raomaster/agent-security-policies)
- Orquestación basada en el approach de [shuttle.dev con Haiku 4.5](https://www.shuttle.dev/blog/2025/10/23/using-haiku-4.5-agents)
