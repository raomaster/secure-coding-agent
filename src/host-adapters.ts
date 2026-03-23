import * as path from "node:path";

import type { ResolvedHost } from "./host.js";

export interface HostAdapter {
    id: ResolvedHost;
    rootGuidanceSource: string;
    rootGuidanceTarget: string;
    commandSourceDir: string;
    commandTargetDir: string;
    skillTargetDir: string;
    agentTargetDir?: string;
    installGeminiMd: boolean;
    supportsMcp: boolean;
}

const HOST_ADAPTERS: Record<ResolvedHost, HostAdapter> = {
    "claude-code": {
        id: "claude-code",
        rootGuidanceSource: "CLAUDE.md",
        rootGuidanceTarget: "CLAUDE.md",
        commandSourceDir: path.join(".claude", "commands"),
        commandTargetDir: path.join(".claude", "commands"),
        skillTargetDir: path.join(".claude", "skills"),
        installGeminiMd: true,
        supportsMcp: true,
    },
    opencode: {
        id: "opencode",
        rootGuidanceSource: "AGENTS.md",
        rootGuidanceTarget: "AGENTS.md",
        commandSourceDir: path.join(".claude", "commands"),
        commandTargetDir: path.join(".opencode", "command"),
        skillTargetDir: path.join(".opencode", "skills"),
        installGeminiMd: false,
        supportsMcp: false,
    },
    "opencode-omo": {
        id: "opencode-omo",
        rootGuidanceSource: "AGENTS.md",
        rootGuidanceTarget: "AGENTS.md",
        commandSourceDir: path.join(".claude", "commands"),
        commandTargetDir: path.join(".claude", "commands"),
        skillTargetDir: path.join(".claude", "skills"),
        agentTargetDir: path.join(".claude", "agents"),
        installGeminiMd: false,
        supportsMcp: false,
    },
};

export function getHostAdapter(host: ResolvedHost): HostAdapter {
    return HOST_ADAPTERS[host];
}
