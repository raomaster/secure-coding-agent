#!/usr/bin/env node
// src/cli.ts — secure-coding-agent CLI entry point

import { parseArgs } from "./args.js";
import { install } from "./installer.js";
import { VERSION, PACKAGE_NAME } from "./meta.js";
import { SUPPORTED_HOSTS } from "./host.js";

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
  ${PACKAGE_NAME} — security-first AI workflow layer for Claude Code and OpenCode hosts

  Usage:  npx ${PACKAGE_NAME} [OPTIONS]

  Options:
    --target <dir>       Target project directory (default: current directory)
    --host <name>        Host mode: ${SUPPORTED_HOSTS.join(", ")} (default: auto)
    --mcp                Also install .claude/settings.json with MCP servers (Claude Code only)
    --no-security        Skip agent-security-policies layer (orchestration only)
    --profile <name>     Security profile: standard or lite (default: standard)
    --version, -v        Show version
    --help, -h           Show this help

  Examples:
    npx ${PACKAGE_NAME}                # install in current directory
    npx ${PACKAGE_NAME} ./my-project   # install in a specific project
    npx ${PACKAGE_NAME} --host opencode-omo
    npx ${PACKAGE_NAME} --mcp          # include MCP servers config
    npx ${PACKAGE_NAME} --no-security  # only orchestration layer

  Recommended install:
    Copy this prompt into your agent session:
    Install and configure secure-coding-agent by following
    https://raw.githubusercontent.com/raomaster/secure-coding-agent/main/docs/guide/installation.md

  Host defaults:
    claude-code  → CLAUDE.md + .claude/commands + .multi-agent.json
    opencode     → AGENTS.md + .opencode/command + .multi-agent.json
    opencode-omo → AGENTS.md + .claude/commands + .multi-agent.json + Aegis

  Layers:
    Layer 1: agent-security-policies security substrate
    Layer 2: secure-coding-agent workflow layer for the resolved host
`);
}
