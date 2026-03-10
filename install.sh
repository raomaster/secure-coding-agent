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
INSTALL_MCP=false
SKIP_SECURITY=false
PROFILE="standard"

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
  echo "    --mcp              Include .claude/settings.json with MCP servers"
  echo "    --no-security      Skip agent-security-policies layer"
  echo "    --profile <name>   standard or lite (default: standard)"
  echo "    --help             Show this help"
  exit 0
}

for arg in "$@"; do
  case "$arg" in
    --help|-h)       usage ;;
    --mcp)           INSTALL_MCP=true ;;
    --no-security)   SKIP_SECURITY=true ;;
    --profile)       shift; PROFILE="${1:-standard}" ;;
    *)               [[ ! "$arg" =~ ^-- ]] && TARGET="$arg" ;;
  esac
done

[[ ! -d "$TARGET" ]] && { echo "❌ Directory not found: $TARGET"; exit 1; }
TARGET="$(cd "$TARGET" && pwd)"

echo ""
echo -e "${BOLD}── secure-coding-agent → $TARGET ──${NC}"
echo ""

# ── Layer 1: agent-security-policies ─────────────────────────────────
if [[ "$SKIP_SECURITY" == false ]]; then
  step "Layer 1: agent-security-policies"
  command -v npx &>/dev/null || { echo "❌ npx not found — install Node.js >= 18"; exit 1; }

  npx --yes agent-security-policies \
    --agent claude,codex,antigravity \
    --skills \
    --profile "$PROFILE" \
    --target "$TARGET"

  ok "agent-security-policies: AGENT_RULES.md + agent configs + security skills"
else
  warn "Skipping security layer (--no-security)"
fi

# ── Layer 2: multi-agent orchestration ───────────────────────────────
step "Layer 2: multi-agent orchestration"

mkdir -p "$TARGET/.claude/commands"

# Append orchestration block to CLAUDE.md
CLAUDE_TARGET="$TARGET/CLAUDE.md"
MARKER="## Multi-Agent Orchestration Layer"

if grep -q "$MARKER" "$CLAUDE_TARGET" 2>/dev/null; then
  warn "CLAUDE.md: orchestration already installed — skipping"
elif [[ ! -f "$CLAUDE_TARGET" ]]; then
  cp "$SCRIPT_DIR/CLAUDE.md" "$CLAUDE_TARGET"
  ok "CLAUDE.md (created)"
else
  printf '\n\n---\n\n' >> "$CLAUDE_TARGET"
  cat "$SCRIPT_DIR/CLAUDE.md" >> "$CLAUDE_TARGET"
  ok "CLAUDE.md (orchestration appended)"
fi

# GEMINI.md — new file, not in agent-security-policies
if [[ -f "$TARGET/GEMINI.md" ]]; then
  warn "GEMINI.md already exists — skipping"
else
  cp "$SCRIPT_DIR/GEMINI.md" "$TARGET/GEMINI.md"
  ok "GEMINI.md"
fi

# Pipeline skills
for skill in plan code review report full-cycle; do
  src="$SCRIPT_DIR/.claude/commands/$skill.md"
  dest="$TARGET/.claude/commands/$skill.md"
  if [[ -f "$dest" ]]; then
    warn ".claude/commands/$skill.md already exists — skipping"
  else
    cp "$src" "$dest"
    ok ".claude/commands/$skill.md"
  fi
done

# MCP settings (optional)
if [[ "$INSTALL_MCP" == true ]]; then
  if [[ -f "$TARGET/.claude/settings.json" ]]; then
    warn ".claude/settings.json already exists — skipping"
  else
    cp "$SCRIPT_DIR/.claude/settings.json" "$TARGET/.claude/settings.json"
    ok ".claude/settings.json (MCP: filesystem + memory)"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Done ──${NC}"
echo ""
echo "Stack:"
echo "  🧠 Planner    → Claude Sonnet 4.6   (Claude Pro)"
echo "  ⚡ Coder      → Claude Haiku 4.5    (Claude Pro)"
echo "  🔍 Reviewer   → Gemini 3.1 Pro      (Google One AI Premium)"
echo "  📊 Reporter   → Gemini Flash        (Google One AI Premium)"
echo "  🤖 Specialist → Codex o4-mini       (ChatGPT Plus/Pro)"
echo ""
echo "  Pipeline: /plan  /code  /review  /report  /full-cycle"
echo "  Security: /sast-scan  /secrets-scan  /dependency-scan"
echo "            /container-scan  /iac-scan  /threat-model  /fix-findings"
echo ""
echo -e "${GREEN}Open Claude Code in $TARGET and try: /full-cycle <your task>${NC}"
echo ""
