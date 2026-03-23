// src/installer.ts — Two-layer installation logic

import * as fs from "node:fs";
import * as path from "node:path";
import * as child_process from "node:child_process";
import { fileURLToPath } from "node:url";
import type { InstallArgs } from "./args.js";
import { describeHost, isOpenCodeHost, resolveHost, type ResolvedHost } from "./host.js";
import {
    PACKAGE_NAME,
    SECURITY_DEP,
    SECURITY_AGENTS,
    PIPELINE_SKILLS,
    ORCHESTRATION_MARKER,
    VERSION,
} from "./meta.js";
import type { MultiAgentConfig } from "./roles.js";

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

function appendManagedInstruction(src: string, dest: string, label: string): void {
    const content = fs.readFileSync(src, "utf-8");

    if (!fs.existsSync(dest)) {
        ensureDir(path.dirname(dest));
        fs.writeFileSync(dest, content, "utf-8");
        ok(`${label} (created)`);
        return;
    }

    const existing = fs.readFileSync(dest, "utf-8");
    if (existing.includes(ORCHESTRATION_MARKER)) {
        warn(`${label}: secure-coding-agent layer already installed — skipping`);
        return;
    }

    fs.appendFileSync(dest, `\n\n---\n\n${content}`, "utf-8");
    ok(`${label} (secure-coding-agent layer appended)`);
}

function getCommandInstallDir(host: ResolvedHost): string {
    return host === "opencode" ? path.join(".opencode", "command") : path.join(".claude", "commands");
}

export function buildSecurityCommandArgs(targetDir: string, profile: string, host: ResolvedHost): string[] {
    const agents = SECURITY_AGENTS[host].join(",");
    const cmdArgs = [
        "--yes",
        SECURITY_DEP,
        "--agent", agents,
        "--skills",
        "--profile", profile,
        "--target", targetDir,
    ];

    if (host === "opencode-omo") {
        cmdArgs.push("--omo");
    }

    return cmdArgs;
}

function buildRolesConfig(host: ResolvedHost): MultiAgentConfig {
    const src = path.join(PACKAGE_ROOT, ".multi-agent.json");
    const config = JSON.parse(fs.readFileSync(src, "utf-8")) as MultiAgentConfig;

    config.version = VERSION;
    config.host = host;

    if (isOpenCodeHost(host)) {
        config.roles.planner = {
            cli: "opencode",
            model: "auto",
            subscription: "OpenCode host session",
            note: "Planning happens in the active OpenCode session",
        };
        config.roles.coder = {
            cli: "opencode",
            model: "auto",
            subscription: "OpenCode host session",
            note: "Implementation happens in the active OpenCode session",
        };
        config.roles.reviewer = {
            cli: "opencode",
            model: "auto",
            subscription: "OpenCode host session",
            note: "Review uses the current OpenCode host by default",
        };
        config.roles.reporter = {
            cli: "opencode",
            model: "auto",
            subscription: "OpenCode host session",
            note: "Reporting uses the current OpenCode host by default",
        };
    }

    return config;
}

function installRootGuidance(targetDir: string, host: ResolvedHost): void {
    if (host === "claude-code") {
        appendManagedInstruction(
            path.join(PACKAGE_ROOT, "CLAUDE.md"),
            path.join(targetDir, "CLAUDE.md"),
            "CLAUDE.md"
        );
        return;
    }

    appendManagedInstruction(
        path.join(PACKAGE_ROOT, "AGENTS.md"),
        path.join(targetDir, "AGENTS.md"),
        "AGENTS.md"
    );
}

// ─── Main ─────────────────────────────────────────────────────────────
export async function install(args: InstallArgs): Promise<void> {
    const targetDir = path.resolve(args.target);

    if (!fs.existsSync(targetDir)) {
        throw new Error(`Target directory does not exist: ${targetDir}`);
    }

    const host = resolveHost(args.host, targetDir);

    console.log(`\n${BOLD}── ${PACKAGE_NAME} → ${targetDir} ──${RESET}\n`);
    info(`Resolved host: ${describeHost(host)}${args.host === "auto" ? " (--host auto)" : ""}`);

    // ── Layer 1: agent-security-policies ──────────────────────────────
    if (!args.skipSecurity) {
        step(`Layer 1: ${SECURITY_DEP}`);
        installSecurityLayer(targetDir, args.profile, host);
    } else {
        warn("Skipping security layer (--no-security)");
    }

    // ── Layer 2: multi-agent orchestration ────────────────────────────
    step(`Layer 2: ${describeHost(host)} workflow layer`);

    ensureDir(path.join(targetDir, getCommandInstallDir(host)));

    installRootGuidance(targetDir, host);
    installRolesConfig(targetDir, host);
    installGeminiMd(targetDir, host);
    installPipelineSkills(targetDir, host);

    if (args.mcp) {
        installMcpSettings(targetDir, host);
    }

    // ── Summary ───────────────────────────────────────────────────────
    printSummary(targetDir, args, host);
}

// ─── Layer 1: call npx agent-security-policies ───────────────────────
function installSecurityLayer(targetDir: string, profile: string, host: ResolvedHost): void {
    const cmdArgs = buildSecurityCommandArgs(targetDir, profile, host);

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

// ─── Layer 2b: .multi-agent.json (role config) ───────────────────────
function installRolesConfig(targetDir: string, host: ResolvedHost): void {
    const dest = path.join(targetDir, ".multi-agent.json");

    if (fs.existsSync(dest)) {
        warn(".multi-agent.json (role configuration) already exists — skipping");
        return;
    }

    const rendered = `${JSON.stringify(buildRolesConfig(host), null, 2)}\n`;
    fs.writeFileSync(dest, rendered, "utf-8");
    ok(".multi-agent.json (role configuration)");
}

// ─── Layer 2c: GEMINI.md (doesn't exist in agent-security-policies) ──
function installGeminiMd(targetDir: string, host: ResolvedHost): void {
    if (isOpenCodeHost(host)) {
        info("Skipping GEMINI.md for OpenCode hosts");
        return;
    }

    const src = path.join(PACKAGE_ROOT, "GEMINI.md");
    const dest = path.join(targetDir, "GEMINI.md");
    copyFile(src, dest, "GEMINI.md");
}

// ─── Layer 2c: pipeline skills ────────────────────────────────────────
function installPipelineSkills(targetDir: string, host: ResolvedHost): void {
    const commandDir = getCommandInstallDir(host);

    for (const skill of PIPELINE_SKILLS) {
        const src = path.join(PACKAGE_ROOT, ".claude", "commands", `${skill}.md`);
        const dest = path.join(targetDir, commandDir, `${skill}.md`);
        if (fs.existsSync(src)) {
            copyFile(src, dest, `${commandDir}/${skill}.md`);
        }
    }
}

// ─── Layer 2d: MCP settings (optional) ───────────────────────────────
function installMcpSettings(targetDir: string, host: ResolvedHost): void {
    if (host !== "claude-code") {
        warn("--mcp currently applies only to Claude Code hosts — skipping");
        return;
    }

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
function printSummary(targetDir: string, args: InstallArgs, host: ResolvedHost): void {
    console.log(`\n${BOLD}── Installation complete ──${RESET}\n`);
    console.log(`Host: ${describeHost(host)}`);
    if (host === "claude-code") {
        console.log("Stack:");
        console.log("  🧠 Planner    → Claude Sonnet 4.6   (Claude Pro)");
        console.log("  ⚡ Coder      → Claude Haiku 4.5    (Claude Pro)");
        console.log("  🔍 Reviewer   → Gemini 3.1 Pro      (Google One AI Premium)");
        console.log("  📊 Reporter   → Gemini Flash        (Google One AI Premium)");
        console.log("  🤖 Specialist → Codex o4-mini       (ChatGPT Plus/Pro)");
    } else {
        console.log("Stack:");
        console.log("  🧠 Planner    → OpenCode host session");
        console.log("  ⚡ Coder      → OpenCode host session");
        console.log("  🔍 Reviewer   → OpenCode host session");
        console.log("  📊 Reporter   → OpenCode host session");
        console.log("  🤖 Specialist → Codex o4-mini       (optional second opinion)");
    }
    console.log("");
    console.log("Pipeline skills: /plan  /code  /review  /report  /full-cycle");
    console.log("Ops skills:      /checkpoint  /rollback  /roles  /lint  /security-review");
    if (!args.skipSecurity) {
        console.log("Security skills: /sast-scan  /secrets-scan  /dependency-scan");
        console.log("                 /container-scan  /iac-scan  /threat-model  /fix-findings");
    }

    const commandDir = getCommandInstallDir(host);
    const rootFile = host === "claude-code" ? "CLAUDE.md" : "AGENTS.md";

    console.log(`Guidance file: ${rootFile}`);
    console.log(`Commands dir:  ${commandDir}`);
    console.log(`Config:        .multi-agent.json`);
    console.log(`\n${GREEN}Done. Open ${describeHost(host)} in ${targetDir} and try: /full-cycle <your task>${RESET}\n`);
}
