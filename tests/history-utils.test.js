const test = require("node:test");
const assert = require("node:assert/strict");

const {
  filterHistory,
  paginateHistory,
  matchedNumbers,
} = require("../history-utils.js");

const NOW = Date.parse("2026-06-17T12:00:00+08:00");

function record(id, betAt) {
  return { id, betAt, lines: [] };
}

test("30-day filter keeps the boundary record and excludes older records", () => {
  const records = [
    record("new", "2026-06-17T08:00:00+08:00"),
    record("boundary", "2026-05-18T12:00:00+08:00"),
    record("old", "2026-05-18T11:59:59+08:00"),
  ];

  assert.deepEqual(
    filterHistory(records, "30d", NOW).map((item) => item.id),
    ["new", "boundary"],
  );
});

test("all filter preserves records without a usable timestamp", () => {
  const records = [record("dated", "2025-01-01T00:00:00+08:00"), record("legacy", "")];

  assert.deepEqual(
    filterHistory(records, "all", NOW).map((item) => item.id),
    ["dated", "legacy"],
  );
});

test("pagination reveals exactly twelve additional records per page", () => {
  const records = Array.from({ length: 25 }, (_, index) => record(String(index), ""));

  assert.equal(paginateHistory(records, 1, 12).length, 12);
  assert.equal(paginateHistory(records, 2, 12).length, 24);
  assert.equal(paginateHistory(records, 3, 12).length, 25);
});

test("matched numbers identifies red and blue hits independently", () => {
  const result = matchedNumbers(
    { reds: [3, 11, 16, 21, 27, 33], blue: 9 },
    { reds: [3, 9, 15, 19, 27, 32], blue: 9 },
  );

  assert.deepEqual(result.reds, [3, 27]);
  assert.equal(result.blue, true);
});
