import assert from "node:assert/strict";
import { test } from "node:test";
import { allowed, select } from "./stage-runtime.mjs";

test("secrets and local state never ship, even when tracked", () => {
  for (const p of ["android-lab/lab/.env", "ios-lab/mac/config.env", "x/notes.local.md", "a/b/key.pem", "win-lab/storage/disk.img", "linux-lab/id_rsa", ".private/x"]) {
    assert.equal(allowed(p), false, p);
  }
  for (const p of ["android-lab/lab/.env.example", "ios-lab/mac/config.env.example", "console/oslab.py"]) {
    assert.equal(allowed(p), true, p);
  }
});

test("only the runtime roots are selected", () => {
  const got = select(["labctl", "console/oslab.py", "dashboard/src/x.ts", "README.md", "firewall-lab/catalog.json", "android-lab/lab/.env", "app/package.json", "labctl-other"]);
  assert.deepEqual(got, ["labctl", "console/oslab.py", "firewall-lab/catalog.json"]);
});
