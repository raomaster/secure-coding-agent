import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../dist/args.js";

test("parseArgs uses current directory by default", () => {
  assert.deepEqual(parseArgs([]), {
    target: ".",
    mcp: false,
    skipSecurity: false,
    profile: "standard",
    help: false,
    version: false,
  });
});

test("parseArgs supports positional target", () => {
  const args = parseArgs(["./demo-project"]);
  assert.equal(args.target, "./demo-project");
});

test("parseArgs supports explicit target and flags", () => {
  const args = parseArgs(["--mcp", "--no-security", "--profile", "lite", "--target", "./demo"]);
  assert.equal(args.mcp, true);
  assert.equal(args.skipSecurity, true);
  assert.equal(args.profile, "lite");
  assert.equal(args.target, "./demo");
});

test("parseArgs rejects missing --target value", () => {
  assert.throws(() => parseArgs(["--target"]), /Missing value for --target/);
  assert.throws(() => parseArgs(["--target", "--mcp"]), /Missing value for --target/);
});

test("parseArgs rejects invalid or missing --profile value", () => {
  assert.throws(() => parseArgs(["--profile"]), /Missing value for --profile/);
  assert.throws(() => parseArgs(["--profile", "--mcp"]), /Missing value for --profile/);
  assert.throws(() => parseArgs(["--profile", "weird"]), /Invalid profile/);
});
