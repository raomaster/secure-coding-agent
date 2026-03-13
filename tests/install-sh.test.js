import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("install.sh parses --profile without treating it as target", async () => {
  const projectDir = await fsp.mkdtemp(path.join(os.tmpdir(), "sca-shell-"));

  await execFileAsync("bash", ["./install.sh", "--no-security", "--profile", "lite", projectDir], {
    cwd: repoRoot,
  });

  assert.equal(fs.existsSync(path.join(projectDir, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, "GEMINI.md")), true);
  assert.equal(fs.existsSync(path.join(projectDir, ".claude", "commands", "security-review.md")), true);
});
