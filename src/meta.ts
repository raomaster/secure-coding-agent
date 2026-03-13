// src/meta.ts — package metadata (single source of truth)

export const PACKAGE_NAME = "secure-coding-agent";
export const VERSION = "0.1.0";

export const SECURITY_DEP = "agent-security-policies";
export const SECURITY_DEP_VERSION = ">=1.4.2";

// Agents to install via agent-security-policies
export const SECURITY_AGENTS = ["claude", "codex", "antigravity"] as const;

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

export const ORCHESTRATION_MARKER = "# Multi-Agent Orchestration Layer";
