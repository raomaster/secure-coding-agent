import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { printRoles } from "../dist/roles.js";

const config = JSON.parse(fs.readFileSync(new URL("../.multi-agent.json", import.meta.url), "utf-8"));

test("printRoles lists supported CLIs from configuration", () => {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => lines.push(args.join(" "));

  try {
    printRoles(config);
  } finally {
    console.log = originalLog;
  }

  const output = lines.join("\n");
  assert.match(output, /claude, gemini, codex, github-copilot, opencode/);
  assert.match(output, /planner/);
  assert.match(output, /reviewer/);
});
