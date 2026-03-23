import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildSecurityCommandArgs, install } from "../dist/installer.js";
import { resolveHost } from "../dist/host.js";
import { PIPELINE_SKILLS } from "../dist/meta.js";

async function makeTempProject() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "sca-install-"));
  return dir;
}

test("TypeScript installer copies expected files in --no-security mode", async () => {
  const projectDir = await makeTempProject();

  await install({
    target: projectDir,
    host: "claude-code",
    mcp: true,
    skipSecurity: true,
    profile: "standard",
    help: false,
    version: false,
  });

  assert.equal(fs.existsSync(path.join(projectDir, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, "GEMINI.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, ".multi-agent.json")), true);
  assert.equal(fs.existsSync(path.join(projectDir, ".claude", "settings.json")), true);

   const config = JSON.parse(await fsp.readFile(path.join(projectDir, ".multi-agent.json"), "utf-8"));
   assert.equal(config.host, "claude-code");

  for (const skill of PIPELINE_SKILLS) {
    assert.equal(
      fs.existsSync(path.join(projectDir, ".claude", "commands", `${skill}.md`)),
      true,
      `missing installed skill ${skill}`
    );
  }
});

test("TypeScript installer does not append orchestration block twice", async () => {
  const projectDir = await makeTempProject();

  await install({
    target: projectDir,
    host: "claude-code",
    mcp: false,
    skipSecurity: true,
    profile: "standard",
    help: false,
    version: false,
  });

  await install({
    target: projectDir,
    host: "claude-code",
    mcp: false,
    skipSecurity: true,
    profile: "standard",
    help: false,
    version: false,
  });

  const claude = await fsp.readFile(path.join(projectDir, "CLAUDE.md"), "utf-8");
  const occurrences = claude.split("# Secure Coding Agent Layer").length - 1;
  assert.equal(occurrences, 1);
});

test("TypeScript installer writes OpenCode assets for the opencode host", async () => {
  const projectDir = await makeTempProject();

  await install({
    target: projectDir,
    host: "opencode",
    mcp: true,
    skipSecurity: true,
    profile: "standard",
    help: false,
    version: false,
  });

  assert.equal(fs.existsSync(path.join(projectDir, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, "GEMINI.md")), false);
  assert.equal(fs.existsSync(path.join(projectDir, ".claude", "settings.json")), false);
  assert.equal(fs.existsSync(path.join(projectDir, ".opencode", "command", "plan.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, ".claude", "commands", "plan.md")), false);

  const config = JSON.parse(await fsp.readFile(path.join(projectDir, ".multi-agent.json"), "utf-8"));
  assert.equal(config.host, "opencode");
  assert.equal(config.roles.planner.cli, "opencode");
  assert.equal(config.roles.reviewer.cli, "opencode");
});

test("TypeScript installer writes OmO-compatible assets for the opencode-omo host", async () => {
  const projectDir = await makeTempProject();

  await install({
    target: projectDir,
    host: "opencode-omo",
    mcp: false,
    skipSecurity: true,
    profile: "standard",
    help: false,
    version: false,
  });

  assert.equal(fs.existsSync(path.join(projectDir, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, ".claude", "commands", "plan.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, ".opencode", "command", "plan.md")), false);

  const config = JSON.parse(await fsp.readFile(path.join(projectDir, ".multi-agent.json"), "utf-8"));
  assert.equal(config.host, "opencode-omo");
  assert.equal(config.roles.coder.cli, "opencode");
});

test("resolveHost detects repo markers and falls back to claude-code", async () => {
  const projectDir = await makeTempProject();
  assert.equal(resolveHost("auto", projectDir), "claude-code");

  await fsp.mkdir(path.join(projectDir, ".claude", "agents"), { recursive: true });
  assert.equal(resolveHost("auto", projectDir), "claude-code");

  await fsp.rm(path.join(projectDir, ".claude"), { recursive: true, force: true });

  await fsp.mkdir(path.join(projectDir, ".opencode"), { recursive: true });
  assert.equal(resolveHost("auto", projectDir), "opencode");

  await fsp.mkdir(path.join(projectDir, ".sisyphus"), { recursive: true });
  assert.equal(resolveHost("auto", projectDir), "opencode-omo");
});

test("buildSecurityCommandArgs routes the security layer by host", async () => {
  const projectDir = await makeTempProject();

  assert.deepEqual(buildSecurityCommandArgs(projectDir, "standard", "claude-code"), [
    "--yes",
    "agent-security-policies",
    "--agent",
    "claude,codex,antigravity",
    "--skills",
    "--profile",
    "standard",
    "--target",
    projectDir,
  ]);

  assert.deepEqual(buildSecurityCommandArgs(projectDir, "lite", "opencode-omo"), [
    "--yes",
    "agent-security-policies",
    "--agent",
    "opencode",
    "--skills",
    "--profile",
    "lite",
    "--target",
    projectDir,
    "--omo",
  ]);
});
