// src/roles.ts — Role configuration types and command generation

import type { ResolvedHost } from "./host.js";

export type RoleName = "planner" | "coder" | "reviewer" | "reporter" | "specialist";
export type CliName = "claude" | "gemini" | "codex" | "github-copilot" | "opencode";

export interface RoleConfig {
    cli: CliName;
    model: string;
    subscription: string;
    note?: string;
}

export interface CliAdapter {
    description: string;
    coder_cmd?: string;
    review_cmd?: string;
    prompt_cmd?: string;
    models: Record<string, string>;
    note?: string;
}

export interface CheckpointConfig {
    strategy: "git-stash" | "file-copy";
    prefix: string;
    fallback_dir: string;
}

export interface MultiAgentConfig {
    version: string;
    host: ResolvedHost;
    roles: Record<RoleName, RoleConfig>;
    cli_adapters: Record<CliName, CliAdapter>;
    checkpoints: CheckpointConfig;
}

// ─── Command builders ─────────────────────────────────────────────────

/**
 * Build the shell command to invoke the coder agent for a given config.
 * Returns the command string with {prompt} placeholder replaced if provided.
 */
export function buildCoderCmd(
    config: MultiAgentConfig,
    prompt?: string
): string {
    const role = config.roles.coder;
    const adapter = config.cli_adapters[role.cli];
    const modelId = adapter.models[role.model] ?? role.model;

    const template = adapter.coder_cmd ?? `echo "No coder_cmd for ${role.cli}"`;
    const cmd = template
        .replace("{model}", modelId)
        .replace("{prompt}", prompt ?? "{prompt}");

    return cmd;
}

/**
 * Build the shell command to invoke the reviewer agent.
 */
export function buildReviewerCmd(
    config: MultiAgentConfig,
    files?: string,
    prompt?: string
): string {
    const role = config.roles.reviewer;
    const adapter = config.cli_adapters[role.cli];
    const modelId = adapter.models[role.model] ?? role.model;

    const template = adapter.review_cmd ?? adapter.prompt_cmd ?? "";
    const cmd = template
        .replace("{model}", modelId)
        .replace("{files}", files ?? "")
        .replace("{prompt}", prompt ?? "{prompt}");

    return cmd;
}

/**
 * Build the shell command to invoke the reporter agent.
 */
export function buildReporterCmd(
    config: MultiAgentConfig,
    prompt?: string
): string {
    const role = config.roles.reporter;
    const adapter = config.cli_adapters[role.cli];
    const modelId = adapter.models[role.model] ?? role.model;

    const template = adapter.prompt_cmd ?? adapter.review_cmd ?? "";
    const cmd = template
        .replace("{model}", modelId)
        .replace("{files}", "")
        .replace("{prompt}", prompt ?? "{prompt}");

    return cmd;
}

/**
 * Print current role assignments for /roles skill.
 */
export function printRoles(config: MultiAgentConfig): void {
    console.log("\nCurrent multi-agent role assignments:\n");
    console.log(`  host         → ${config.host}`);
    for (const [role, cfg] of Object.entries(config.roles)) {
        const adapter = config.cli_adapters[cfg.cli as CliName];
        const modelId = adapter?.models[cfg.model] ?? cfg.model;
        console.log(`  ${role.padEnd(12)} → ${cfg.cli} (${modelId})   [${cfg.subscription}]`);
    }
    console.log("\nTo change a role, edit .multi-agent.json");
    console.log("Supported CLIs:", Object.keys(config.cli_adapters).join(", "));
}
