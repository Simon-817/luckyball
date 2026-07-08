const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const WORKFLOW = fs.readFileSync(
  path.join(__dirname, "..", ".github", "workflows", "sync-lottery-history.yml"),
  "utf8",
);

test("lottery history workflow starts at 21:16 China time on draw days", () => {
  assert.match(WORKFLOW, /cron:\s*"16 13 \* \* 0,2,4"/);
});

test("lottery history workflow retries every minute until the current draw is available", () => {
  assert.match(WORKFLOW, /sync_lottery_history\.py --wait-for-current/);
  assert.match(WORKFLOW, /--interval-seconds 60/);
  assert.match(WORKFLOW, /data\/lottery_history\.json/);
});
