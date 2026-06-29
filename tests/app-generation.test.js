const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const APP_JS = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

test("AI pick flow generates three strategy lines without fixed picks", () => {
  assert.match(APP_JS, /const CURRENT_PICK_COUNT = 3;/);
  assert.match(APP_JS, /function generateAiLines\(count = CURRENT_PICK_COUNT\)/);
  assert.match(APP_JS, /const lines = generateAiLines\(\);/);
  assert.match(APP_JS, /state\.generatedLine = lines\[0\];/);
  assert.match(APP_JS, /state\.currentLines = lines;/);
  assert.doesNotMatch(APP_JS, /const FIXED_LINES/);
  assert.doesNotMatch(APP_JS, /FIXED_LINES\.map/);
});
