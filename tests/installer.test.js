import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { install } from "../dist/installer.js";
import { PIPELINE_SKILLS } from "../dist/meta.js";

async function makeTempProject() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "sca-install-"));
  return dir;
}

test("TypeScript installer copies expected files in --no-security mode", async () => {
  const projectDir = await makeTempProject();

  await install({
    target: projectDir,
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
    mcp: false,
    skipSecurity: true,
    profile: "standard",
    help: false,
    version: false,
  });

  await install({
    target: projectDir,
    mcp: false,
    skipSecurity: true,
    profile: "standard",
    help: false,
    version: false,
  });

  const claude = await fsp.readFile(path.join(projectDir, "CLAUDE.md"), "utf-8");
  const occurrences = claude.split("# Multi-Agent Orchestration Layer").length - 1;
  assert.equal(occurrences, 1);
});
