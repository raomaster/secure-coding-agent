#!/usr/bin/env node
// src/cli.ts — secure-coding-agent CLI entry point

import { parseArgs } from "./args.js";
import { install } from "./installer.js";
import { VERSION, PACKAGE_NAME } from "./meta.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
    printHelp();
    process.exit(0);
}

if (args.version) {
    console.log(`${PACKAGE_NAME} v${VERSION}`);
    process.exit(0);
}

install(args).catch((err: Error) => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
});

// ─── Help ────────────────────────────────────────────────────────────
function printHelp(): void {
    console.log(`
  ${PACKAGE_NAME} — multi-agent orchestration for subscription-based AI CLIs

  Usage:  npx ${PACKAGE_NAME} [OPTIONS]

  Options:
    --target <dir>       Target project directory (default: .)
    --mcp                Also install .claude/settings.json with MCP servers
    --no-security        Skip agent-security-policies layer (orchestration only)
    --profile <name>     Security profile: standard or lite (default: standard)
    --version, -v        Show version
    --help, -h           Show this help

  Examples:
    npx ${PACKAGE_NAME}                          # install in current directory
    npx ${PACKAGE_NAME} --target ./my-project   # install in a specific project
    npx ${PACKAGE_NAME} --mcp                   # include MCP servers config
    npx ${PACKAGE_NAME} --no-security           # only orchestration layer

  Stack installed:
    🧠 Planner    → Claude Sonnet 4.6   (Claude Pro)
    ⚡ Coder      → Claude Haiku 4.5    (Claude Pro)
    🔍 Reviewer   → Gemini 3.1 Pro      (Google One AI Premium)
    📊 Reporter   → Gemini Flash        (Google One AI Premium)
    🤖 Specialist → Codex o4-mini       (ChatGPT Plus/Pro)

  Layers:
    Layer 1: npx agent-security-policies --agent claude,codex,antigravity --skills
    Layer 2: Multi-agent orchestration (append to CLAUDE.md) + GEMINI.md + pipeline skills
`);
}
