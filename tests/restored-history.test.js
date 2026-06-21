const test = require("node:test");
const assert = require("node:assert/strict");

const {
  RESTORED_HISTORY_RECORDS,
} = require("../restored-history.js");

test("restored betting history covers the cleared records with valid lines", () => {
  assert.deepEqual(
    RESTORED_HISTORY_RECORDS.map((record) => record.issue),
    ["2026070", "2026069", "2026068", "2026067", "2026066", "2026064", "2026063", "2026062", "2026061", "2026060"],
  );

  RESTORED_HISTORY_RECORDS.forEach((record) => {
    assert.equal(record.lines.length, 3, `issue ${record.issue} should have three lines`);
    record.lines.forEach((line) => {
      assert.equal(line.reds.length, 6, `issue ${record.issue} has an invalid red-ball count`);
      assert.equal(new Set(line.reds).size, 6, `issue ${record.issue} has duplicate red balls`);
    });
  });
});

test("restored 2026066 second line keeps the inferred missing red ball", () => {
  const record = RESTORED_HISTORY_RECORDS.find((item) => item.issue === "2026066");
  assert.deepEqual(record.lines[1], {
    reds: [5, 22, 24, 26, 29, 32],
    blue: 12,
    type: "fixed",
  });
});
