// src/installer.ts — Two-layer installation logic

import * as fs from "node:fs";
import * as path from "node:path";
import * as child_process from "node:child_process";
import { fileURLToPath } from "node:url";
import type { InstallArgs } from "./args.js";
import {
    SECURITY_DEP,
    SECURITY_AGENTS,
    PIPELINE_SKILLS,
    ORCHESTRATION_MARKER,
} from "./meta.js";

// ─── Package root (where CLAUDE.md, GEMINI.md, .claude/commands/ live) ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, "..");

// ─── Logging ─────────────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const ok = (msg: string) => console.log(`${GREEN}✅${RESET} ${msg}`);
const info = (msg: string) => console.log(`${BLUE}ℹ${RESET}  ${msg}`);
const warn = (msg: string) => console.log(`${YELLOW}⚠${RESET}  ${msg}`);
const step = (msg: string) => console.log(`\n${BOLD}── ${msg} ──${RESET}`);

// ─── Helpers ─────────────────────────────────────────────────────────
function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFile(src: string, dest: string, label: string): boolean {
    if (fs.existsSync(dest)) {
        warn(`${label} already exists — skipping`);
        return false;
    }
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    ok(label);
    return true;
}

// ─── Main ─────────────────────────────────────────────────────────────
export async function install(args: InstallArgs): Promise<void> {
    const targetDir = path.resolve(args.target);

    if (!fs.existsSync(targetDir)) {
        throw new Error(`Target directory does not exist: ${targetDir}`);
    }

    console.log(`\n${BOLD}── secure-coding-agent → ${targetDir} ──${RESET}\n`);

    // ── Layer 1: agent-security-policies ──────────────────────────────
    if (!args.skipSecurity) {
        step(`Layer 1: ${SECURITY_DEP}`);
        installSecurityLayer(targetDir, args.profile);
    } else {
        warn("Skipping security layer (--no-security)");
    }

    // ── Layer 2: multi-agent orchestration ────────────────────────────
    step("Layer 2: multi-agent orchestration");

    ensureDir(path.join(targetDir, ".claude", "commands"));

    installOrchestrationAppend(targetDir);
    installRolesConfig(targetDir);
    installGeminiMd(targetDir);
    installPipelineSkills(targetDir);

    if (args.mcp) {
        installMcpSettings(targetDir);
    }

    // ── Summary ───────────────────────────────────────────────────────
    printSummary(targetDir, args);
}

// ─── Layer 1: call npx agent-security-policies ───────────────────────
function installSecurityLayer(targetDir: string, profile: string): void {
    const agents = SECURITY_AGENTS.join(",");
    const cmdArgs = [
        "--yes",
        SECURITY_DEP,
        "--agent", agents,
        "--skills",
        "--profile", profile,
        "--target", targetDir,
    ];

    info(`Running: npx ${cmdArgs.join(" ")}`);

    try {
        child_process.execFileSync("npx", cmdArgs, { stdio: "inherit" });
        ok(`${SECURITY_DEP}: AGENT_RULES.md + agent configs + security skills`);
    } catch {
        throw new Error(
            `Failed to run ${SECURITY_DEP}. Ensure Node.js >= 18 and npm access.\nCommand: npx ${cmdArgs.join(" ")}`
        );
    }
}

// ─── Layer 2a: append orchestration block to CLAUDE.md ───────────────
function installOrchestrationAppend(targetDir: string): void {
    const claudeSrc = path.join(PACKAGE_ROOT, "CLAUDE.md");
    const claudeDest = path.join(targetDir, "CLAUDE.md");
    const orchContent = fs.readFileSync(claudeSrc, "utf-8");

    if (!fs.existsSync(claudeDest)) {
        // No CLAUDE.md yet (e.g., --no-security) — create it directly
        fs.writeFileSync(claudeDest, orchContent, "utf-8");
        ok("CLAUDE.md (created)");
        return;
    }

    const existing = fs.readFileSync(claudeDest, "utf-8");

    if (existing.includes(ORCHESTRATION_MARKER)) {
        warn("CLAUDE.md: orchestration already installed — skipping");
        return;
    }

    // Append orchestration layer
    fs.appendFileSync(claudeDest, `\n\n---\n\n${orchContent}`, "utf-8");
    ok("CLAUDE.md (orchestration appended)");
}

// ─── Layer 2b: .multi-agent.json (role config) ───────────────────────
function installRolesConfig(targetDir: string): void {
    const src = path.join(PACKAGE_ROOT, ".multi-agent.json");
    const dest = path.join(targetDir, ".multi-agent.json");
    copyFile(src, dest, ".multi-agent.json (role configuration)");
}

// ─── Layer 2c: GEMINI.md (doesn't exist in agent-security-policies) ──
function installGeminiMd(targetDir: string): void {
    const src = path.join(PACKAGE_ROOT, "GEMINI.md");
    const dest = path.join(targetDir, "GEMINI.md");
    copyFile(src, dest, "GEMINI.md");
}

// ─── Layer 2c: pipeline skills ────────────────────────────────────────
function installPipelineSkills(targetDir: string): void {
    for (const skill of PIPELINE_SKILLS) {
        const src = path.join(PACKAGE_ROOT, ".claude", "commands", `${skill}.md`);
        const dest = path.join(targetDir, ".claude", "commands", `${skill}.md`);
        if (fs.existsSync(src)) {
            copyFile(src, dest, `.claude/commands/${skill}.md`);
        }
    }
}

// ─── Layer 2d: MCP settings (optional) ───────────────────────────────
function installMcpSettings(targetDir: string): void {
    const src = path.join(PACKAGE_ROOT, ".claude", "settings.json");
    const dest = path.join(targetDir, ".claude", "settings.json");

    if (!fs.existsSync(src)) return;

    if (fs.existsSync(dest)) {
        warn(".claude/settings.json already exists — skipping (add MCP servers manually)");
        return;
    }

    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    ok(".claude/settings.json (MCP: filesystem + memory)");
}

// ─── Summary ─────────────────────────────────────────────────────────
function printSummary(targetDir: string, args: InstallArgs): void {
    console.log(`\n${BOLD}── Installation complete ──${RESET}\n`);
    console.log("Stack:");
    console.log("  🧠 Planner    → Claude Sonnet 4.6   (Claude Pro)");
    console.log("  ⚡ Coder      → Claude Haiku 4.5    (Claude Pro)");
    console.log("  🔍 Reviewer   → Gemini 3.1 Pro      (Google One AI Premium)");
    console.log("  📊 Reporter   → Gemini Flash        (Google One AI Premium)");
    console.log("  🤖 Specialist → Codex o4-mini       (ChatGPT Plus/Pro)");
    console.log("");
    console.log("Pipeline skills: /plan  /code  /review  /report  /full-cycle");
    console.log("Ops skills:      /checkpoint  /rollback  /roles  /lint  /security-review");
    if (!args.skipSecurity) {
        console.log("Security skills: /sast-scan  /secrets-scan  /dependency-scan");
        console.log("                 /container-scan  /iac-scan  /threat-model  /fix-findings");
    }
    console.log(`\n${GREEN}Done. Open Claude Code in ${targetDir} and try: /full-cycle <your task>${RESET}\n`);
}
