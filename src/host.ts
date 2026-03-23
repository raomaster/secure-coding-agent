import fs from "node:fs";
import path from "node:path";

export const SUPPORTED_HOSTS = ["auto", "claude-code", "opencode", "opencode-omo"] as const;

export type InstallHost = (typeof SUPPORTED_HOSTS)[number];
export type ResolvedHost = Exclude<InstallHost, "auto">;

export const DEFAULT_HOST: InstallHost = "auto";

const OMO_CONFIG_MARKERS = [
    ".opencode/oh-my-opencode.json",
    ".opencode/oh-my-opencode.jsonc",
    ".sisyphus",
];

const OPENCODE_MARKERS = [".opencode", "opencode.json", "opencode.jsonc", "AGENTS.md"];
const OMO_COMPAT_MARKERS = [".claude/agents", ".claude/rules"];
const CLAUDE_MARKERS = [".claude", "CLAUDE.md"];

export function isOpenCodeHost(host: ResolvedHost): boolean {
    return host === "opencode" || host === "opencode-omo";
}

export function detectHost(targetDir: string): ResolvedHost {
    if (hasAnyMarker(targetDir, OMO_CONFIG_MARKERS)) {
        return "opencode-omo";
    }

    if (hasAnyMarker(targetDir, OPENCODE_MARKERS)) {
        if (hasAnyMarker(targetDir, OMO_COMPAT_MARKERS)) {
            return "opencode-omo";
        }
        return "opencode";
    }

    if (hasAnyMarker(targetDir, CLAUDE_MARKERS)) {
        return "claude-code";
    }

    return "claude-code";
}

export function resolveHost(host: InstallHost, targetDir: string): ResolvedHost {
    if (host === "auto") {
        return detectHost(targetDir);
    }

    return host;
}

export function describeHost(host: ResolvedHost): string {
    switch (host) {
        case "claude-code":
            return "Claude Code";
        case "opencode":
            return "OpenCode";
        case "opencode-omo":
            return "OpenCode + oh-my-openagent";
    }
}

function hasAnyMarker(targetDir: string, markers: readonly string[]): boolean {
    return markers.some((marker) => fs.existsSync(path.join(targetDir, marker)));
}
