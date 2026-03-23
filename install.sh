#!/usr/bin/env bash
# secure-coding-agent — bash installer (alternative to npx)
# For projects without Node.js, or for quick local use.
# Preferred: npx secure-coding-agent [OPTIONS]
#
# Usage:
#   ./install.sh [TARGET_DIR]        # default: current directory
#   ./install.sh --mcp [TARGET]      # include MCP servers config
#   ./install.sh --no-security       # skip agent-security-policies layer
#   ./install.sh --profile lite      # use lite security profile
#   ./install.sh --help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="."
HOST="auto"
INSTALL_MCP=false
SKIP_SECURITY=false
PROFILE="standard"
VERSION="0.1.2"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[0;33m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅${NC} $1"; }
info() { echo -e "${BLUE}ℹ${NC}  $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
step() { echo -e "\n${BOLD}── $1 ──${NC}"; }

usage() {
  echo ""
  echo -e "${BOLD}secure-coding-agent installer${NC}"
  echo ""
  echo "  Preferred: npx secure-coding-agent [OPTIONS]"
  echo ""
  echo "  Usage: install.sh [TARGET_DIR] [OPTIONS]"
  echo ""
  echo "  Options:"
  echo "    --host <name>      auto, claude-code, opencode, opencode-omo"
  echo "    --mcp              Include .claude/settings.json with MCP servers (Claude Code only)"
  echo "    --no-security      Skip agent-security-policies layer"
  echo "    --profile <name>   standard or lite (default: standard)"
  echo "    --help             Show this help"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      usage
      ;;
    --mcp)
      INSTALL_MCP=true
      shift
      ;;
    --host)
      [[ $# -lt 2 || "$2" == --* ]] && { echo "❌ Missing value for --host"; exit 1; }
      HOST="$2"
      shift 2
      ;;
    --no-security)
      SKIP_SECURITY=true
      shift
      ;;
    --profile)
      [[ $# -lt 2 || "$2" == --* ]] && { echo "❌ Missing value for --profile"; exit 1; }
      PROFILE="$2"
      shift 2
      ;;
    --target)
      [[ $# -lt 2 || "$2" == --* ]] && { echo "❌ Missing value for --target"; exit 1; }
      TARGET="$2"
      shift 2
      ;;
    --*)
      echo "❌ Unknown option: $1"
      exit 1
      ;;
    *)
      TARGET="$1"
      shift
      ;;
  esac
done

if [[ "$PROFILE" != "standard" && "$PROFILE" != "lite" ]]; then
  echo "❌ Invalid profile: $PROFILE. Use 'standard' or 'lite'."
  exit 1
fi

if [[ "$HOST" != "auto" && "$HOST" != "claude-code" && "$HOST" != "opencode" && "$HOST" != "opencode-omo" ]]; then
  echo "❌ Invalid host: $HOST. Use auto, claude-code, opencode, or opencode-omo."
  exit 1
fi

[[ ! -d "$TARGET" ]] && { echo "❌ Directory not found: $TARGET"; exit 1; }
TARGET="$(cd "$TARGET" && pwd)"

detect_host() {
  if [[ -f "$TARGET/.opencode/oh-my-opencode.json" || -f "$TARGET/.opencode/oh-my-opencode.jsonc" || -d "$TARGET/.sisyphus" ]]; then
    echo "opencode-omo"
  elif [[ -d "$TARGET/.opencode" || -f "$TARGET/opencode.json" || -f "$TARGET/opencode.jsonc" || -f "$TARGET/AGENTS.md" ]]; then
    if [[ -d "$TARGET/.claude/agents" || -d "$TARGET/.claude/rules" ]]; then
      echo "opencode-omo"
    else
      echo "opencode"
    fi
  else
    echo "claude-code"
  fi
}

append_managed_instruction() {
  local src="$1"
  local dest="$2"
  local label="$3"
  local marker="# Secure Coding Agent Layer"

  mkdir -p "$(dirname "$dest")"

  if [[ -f "$dest" ]] && grep -q "$marker" "$dest" 2>/dev/null; then
    warn "$label: secure-coding-agent layer already installed — skipping"
    return
  fi

  if [[ ! -f "$dest" ]]; then
    cp "$src" "$dest"
    ok "$label (created)"
  else
    printf '\n\n---\n\n' >> "$dest"
    cat "$src" >> "$dest"
    ok "$label (secure-coding-agent layer appended)"
  fi
}

render_roles_config() {
  local src="$SCRIPT_DIR/.multi-agent.json"
  local dest="$TARGET/.multi-agent.json"

  if [[ -f "$dest" ]]; then
    warn ".multi-agent.json (role configuration) already exists — skipping"
    return
  fi

  python3 - "$src" "$dest" "$HOST_RESOLVED" "$VERSION" <<'PY'
import json
import sys

src, dest, host, version = sys.argv[1:5]

with open(src, "r", encoding="utf-8") as f:
    config = json.load(f)

config["version"] = version
config["host"] = host

if host in {"opencode", "opencode-omo"}:
    config["roles"]["planner"] = {
        "cli": "opencode",
        "model": "auto",
        "subscription": "OpenCode host session",
        "note": "Planning happens in the active OpenCode session",
    }
    config["roles"]["coder"] = {
        "cli": "opencode",
        "model": "auto",
        "subscription": "OpenCode host session",
        "note": "Implementation happens in the active OpenCode session",
    }
    config["roles"]["reviewer"] = {
        "cli": "opencode",
        "model": "auto",
        "subscription": "OpenCode host session",
        "note": "Review uses the current OpenCode host by default",
    }
    config["roles"]["reporter"] = {
        "cli": "opencode",
        "model": "auto",
        "subscription": "OpenCode host session",
        "note": "Reporting uses the current OpenCode host by default",
    }

with open(dest, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)
    f.write("\n")
PY

  ok ".multi-agent.json (role configuration)"
}

install_pipeline_skills() {
  local dest_dir
  if [[ "$HOST_RESOLVED" == "opencode" ]]; then
    dest_dir="$TARGET/.opencode/command"
  else
    dest_dir="$TARGET/.claude/commands"
  fi

  mkdir -p "$dest_dir"

  for src in "$SCRIPT_DIR"/.claude/commands/*.md; do
    local skill
    local dest
    skill="$(basename "$src")"
    dest="$dest_dir/$skill"
    if [[ -f "$dest" ]]; then
      warn "${dest#"$TARGET/"} already exists — skipping"
    else
      cp "$src" "$dest"
      ok "${dest#"$TARGET/"}"
    fi
  done
}

if [[ "$HOST" == "auto" ]]; then
  HOST_RESOLVED="$(detect_host)"
else
  HOST_RESOLVED="$HOST"
fi

HOST_NOTE=""
if [[ "$HOST" == "auto" ]]; then
  HOST_NOTE=" (--host auto)"
fi

echo ""
echo -e "${BOLD}── secure-coding-agent → $TARGET ──${NC}"
echo ""
info "Resolved host: $HOST_RESOLVED$HOST_NOTE"

# ── Layer 1: agent-security-policies ─────────────────────────────────
if [[ "$SKIP_SECURITY" == false ]]; then
  step "Layer 1: agent-security-policies"
  command -v npx &>/dev/null || { echo "❌ npx not found — install Node.js >= 18"; exit 1; }

  SECURITY_AGENTS="claude,codex,antigravity"
  SECURITY_EXTRA=()

  case "$HOST_RESOLVED" in
    opencode)
      SECURITY_AGENTS="opencode"
      ;;
    opencode-omo)
      SECURITY_AGENTS="opencode"
      SECURITY_EXTRA+=(--omo)
      ;;
  esac

  npx --yes agent-security-policies \
    --agent "$SECURITY_AGENTS" \
    --skills \
    --profile "$PROFILE" \
    --target "$TARGET" \
    "${SECURITY_EXTRA[@]}"

  ok "agent-security-policies: AGENT_RULES.md + agent configs + security skills"
else
  warn "Skipping security layer (--no-security)"
fi

# ── Layer 2: host-aware workflow layer ───────────────────────────────
step "Layer 2: $HOST_RESOLVED workflow layer"

case "$HOST_RESOLVED" in
  claude-code)
    append_managed_instruction "$SCRIPT_DIR/CLAUDE.md" "$TARGET/CLAUDE.md" "CLAUDE.md"
    if [[ -f "$TARGET/GEMINI.md" ]]; then
      warn "GEMINI.md already exists — skipping"
    else
      cp "$SCRIPT_DIR/GEMINI.md" "$TARGET/GEMINI.md"
      ok "GEMINI.md"
    fi
    ;;
  opencode|opencode-omo)
    append_managed_instruction "$SCRIPT_DIR/AGENTS.md" "$TARGET/AGENTS.md" "AGENTS.md"
    info "Skipping GEMINI.md for OpenCode hosts"
    ;;
esac

render_roles_config
install_pipeline_skills

# MCP settings (optional)
if [[ "$INSTALL_MCP" == true ]]; then
  if [[ "$HOST_RESOLVED" != "claude-code" ]]; then
    warn "--mcp currently applies only to Claude Code hosts — skipping"
  elif [[ -f "$TARGET/.claude/settings.json" ]]; then
    warn ".claude/settings.json already exists — skipping"
  else
    mkdir -p "$TARGET/.claude"
    cp "$SCRIPT_DIR/.claude/settings.json" "$TARGET/.claude/settings.json"
    ok ".claude/settings.json (MCP: filesystem + memory)"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Done ──${NC}"
echo ""
echo "Host: $HOST_RESOLVED"
if [[ "$HOST_RESOLVED" == "claude-code" ]]; then
  echo "Stack:"
  echo "  🧠 Planner    → Claude Sonnet 4.6   (Claude Pro)"
  echo "  ⚡ Coder      → Claude Haiku 4.5    (Claude Pro)"
  echo "  🔍 Reviewer   → Gemini 3.1 Pro      (Google One AI Premium)"
  echo "  📊 Reporter   → Gemini Flash        (Google One AI Premium)"
  echo "  🤖 Specialist → Codex o4-mini       (ChatGPT Plus/Pro)"
else
  echo "Stack:"
  echo "  🧠 Planner    → OpenCode host session"
  echo "  ⚡ Coder      → OpenCode host session"
  echo "  🔍 Reviewer   → OpenCode host session"
  echo "  📊 Reporter   → OpenCode host session"
  echo "  🤖 Specialist → Codex o4-mini       (optional second opinion)"
fi
echo ""
echo "  Pipeline: /plan  /code  /review  /report  /full-cycle"
echo "  Ops:      /checkpoint  /rollback  /roles  /lint  /security-review"
echo "  Security: /sast-scan  /secrets-scan  /dependency-scan"
echo "            /container-scan  /iac-scan  /threat-model  /fix-findings"
echo ""
if [[ "$HOST_RESOLVED" == "claude-code" ]]; then
  echo "  Guidance: CLAUDE.md"
  echo "  Commands: .claude/commands/"
else
  echo "  Guidance: AGENTS.md"
  if [[ "$HOST_RESOLVED" == "opencode" ]]; then
    echo "  Commands: .opencode/command/"
  else
    echo "  Commands: .claude/commands/"
  fi
fi
echo "  Config:   .multi-agent.json"
echo ""
echo -e "${GREEN}Open $HOST_RESOLVED in $TARGET and try: /full-cycle <your task>${NC}"
echo ""
