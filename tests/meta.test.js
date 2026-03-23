import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BUILTIN_SKILLS, OMO_AGENT_FILES, PIPELINE_SKILLS } from "../dist/meta.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("PIPELINE_SKILLS matches the command files shipped in the repository", () => {
  const commandDir = path.join(repoRoot, ".claude", "commands");
  const actual = fs.readdirSync(commandDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""))
    .sort();

  const expected = [...PIPELINE_SKILLS].sort();
  assert.deepEqual(expected, actual);
});

test("BUILTIN_SKILLS matches the packaged skill templates", () => {
  const skillsDir = path.join(repoRoot, "templates", "skills");
  const actual = fs.readdirSync(skillsDir)
    .filter((name) => fs.existsSync(path.join(skillsDir, name, "SKILL.md")))
    .sort();

  const expected = [...BUILTIN_SKILLS].sort();
  assert.deepEqual(expected, actual);
});

test("OMO_AGENT_FILES matches the packaged OmO agent templates", () => {
  const agentsDir = path.join(repoRoot, "templates", "agents");
  const actual = fs.readdirSync(agentsDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""))
    .sort();

  const expected = [...OMO_AGENT_FILES].sort();
  assert.deepEqual(expected, actual);
});
