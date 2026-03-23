// src/meta.ts — package metadata (single source of truth)

export const PACKAGE_NAME = "secure-coding-agent";
export const VERSION = "0.2.0";

export const SECURITY_DEP = "agent-security-policies";
export const SECURITY_DEP_VERSION = ">=1.4.2";

export const SECURITY_AGENTS = {
    "claude-code": ["claude", "codex", "antigravity"],
    opencode: ["opencode"],
    "opencode-omo": ["opencode"],
} as const;

// Pipeline skills provided by THIS package (security skills come from agent-security-policies)
export const PIPELINE_SKILLS = [
    "plan",
    "code",
    "review",
    "report",
    "full-cycle",
    "checkpoint",
    "rollback",
    "roles",
    "lint",
    "security-review",
] as const;

export const BUILTIN_SKILLS = ["create-skill"] as const;

export const OMO_AGENT_FILES = [
    "archive-note",
    "barrier-review",
    "valkyrie-check",
    "valkyrie-forge",
] as const;

export const DEFAULT_PERSISTENCE_DIR = ".secure-coding";

export const ORCHESTRATION_MARKER = "# Secure Coding Agent Layer";
