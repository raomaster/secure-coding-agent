---
description: "Muestra y gestiona los roles del stack multi-agente — cambia qué CLI usa cada rol"
---

Muestra la configuración actual de roles y permite cambiar qué CLI usa cada rol.

$ARGUMENTS (opcional: "set <rol> <cli> <model>" para cambiar un rol)

## Proceso

### Ver roles actuales

Lee `.multi-agent.json` y muestra el stack actual:

```bash
cat .multi-agent.json | python3 -c "
import json, sys
config = json.load(sys.stdin)
roles = config['roles']
adapters = config['cli_adapters']

print('\nStack multi-agente actual:\n')
for role, cfg in roles.items():
    cli = cfg['cli']
    model_alias = cfg['model']
    model_id = adapters.get(cli, {}).get('models', {}).get(model_alias, model_alias)
    sub = cfg['subscription']
    print(f'  {role:<12} → {cli:<16} model: {model_id:<30} [{sub}]')

print('\nCLIs disponibles:')
for cli, adapter in adapters.items():
    print(f'  {cli:<18} {adapter[\"description\"]}')
print()
"
```

### Cambiar un rol

Si $ARGUMENTS contiene "set <rol> <cli> <model>":

```bash
# Ejemplo: /roles set coder codex o4-mini
# Ejemplo: /roles set reviewer gemini flash
# Ejemplo: /roles set coder opencode auto

python3 << 'EOF'
import json, sys

args = "$ARGUMENTS".split()
if len(args) >= 4 and args[0] == "set":
    _, role, cli, model = args[0], args[1], args[2], args[3]

    with open(".multi-agent.json", "r") as f:
        config = json.load(f)

    if role not in config["roles"]:
        print(f"❌ Rol desconocido: {role}")
        print(f"   Roles válidos: {list(config['roles'].keys())}")
        sys.exit(1)

    if cli not in config["cli_adapters"]:
        print(f"❌ CLI desconocido: {cli}")
        print(f"   CLIs disponibles: {list(config['cli_adapters'].keys())}")
        sys.exit(1)

    old = config["roles"][role]
    config["roles"][role]["cli"] = cli
    config["roles"][role]["model"] = model

    with open(".multi-agent.json", "w") as f:
        json.dump(config, f, indent=2)

    print(f"✅ Rol '{role}' actualizado:")
    print(f"   Antes: {old['cli']} ({old['model']})")
    print(f"   Ahora: {cli} ({model})")
    print(f"\n   Los skills de Claude Code (/code, /review, etc.) usarán el nuevo CLI automáticamente.")
EOF
```

## Comandos Rápidos

```bash
# Ver configuración completa
/roles

# Cambiar coder a Codex (si tienes ChatGPT Plus)
/roles set coder codex o4-mini

# Cambiar reviewer a Gemini Flash (más rápido)
/roles set reviewer gemini flash

# Cambiar reviewer a Codex (segunda opinión OpenAI)
/roles set reviewer codex o3

# Volver a Haiku como coder
/roles set coder claude haiku
```

## Cómo los Skills Usan Esta Config

Todos los skills de pipeline (`/code`, `/review`, `/report`) leen `.multi-agent.json` para construir el comando correcto.

Al cambiar un rol aquí → todos los skills se adaptan automáticamente sin editar ningún archivo adicional.

## Compatibilidad de CLIs por Rol

| CLI | Coder | Reviewer | Reporter | Notas |
|-----|-------|----------|----------|-------|
| `claude` | ✅ haiku/sonnet | ❌ | ❌ | Requiere `CLAUDECODE=` para spawn |
| `gemini` | ❌ | ✅ pro | ✅ flash | 2M ctx, token caching |
| `codex` | ✅ o4-mini/o3 | ✅ o3 | ❌ | ChatGPT Plus/Pro |
| `github-copilot` | ⚠️ limitado | ❌ | ❌ | Solo sugerencias de shell |
| `opencode` | ✅ auto | ❌ | ❌ | Requiere suscripción opencode.ai |
