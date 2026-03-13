import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PIPELINE_SKILLS } from "../dist/meta.js";

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
