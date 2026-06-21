const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const INDEX_HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("draw refresh scripts use the current cache-busting version", () => {
  assert.match(INDEX_HTML, /history-utils\.js\?v=20260621-draw-refresh-v2/);
  assert.match(INDEX_HTML, /app\.js\?v=20260621-draw-refresh-v2/);
});
