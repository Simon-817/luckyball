const test = require("node:test");
const assert = require("node:assert/strict");

const {
  filterHistory,
  paginateHistory,
  matchedNumbers,
  calculateWinningStats,
  mergePrizeData,
  normalizePrizeRows,
  parseHtmlDraws,
  evaluateLine,
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

test("winning statistics follow the selected history time range", () => {
  const records = [
    {
      id: "recent",
      issue: "2026068",
      betAt: "2026-06-16T20:00:00+08:00",
      lines: [
        { reds: [3, 5, 16, 18, 29, 32], blue: 4 },
        { reds: [1, 2, 6, 9, 17, 28], blue: 12 },
      ],
    },
    {
      id: "older",
      issue: "2026048",
      betAt: "2026-05-01T20:00:00+08:00",
      lines: [{ reds: [1, 2, 6, 9, 17, 28], blue: 7 }],
    },
  ];
  const draws = [
    {
      issue: "2026068",
      reds: [3, 5, 16, 18, 29, 32],
      blue: 4,
      prizes: { 一等奖: 5649404 },
    },
    {
      issue: "2026048",
      reds: [4, 8, 13, 19, 25, 33],
      blue: 7,
      prizes: {},
    },
  ];

  assert.deepEqual(calculateWinningStats(records, draws, "30d", NOW), {
    winCount: 1,
    totalAmount: 5649404,
    unresolvedAmountCount: 0,
  });
  assert.deepEqual(calculateWinningStats(records, draws, "1y", NOW), {
    winCount: 2,
    totalAmount: 5649409,
    unresolvedAmountCount: 0,
  });
});

test("floating prize without synced amount is reported as unresolved", () => {
  const records = [{
    id: "recent",
    issue: "2026068",
    betAt: "2026-06-16T20:00:00+08:00",
    lines: [{ reds: [3, 5, 16, 18, 29, 32], blue: 4 }],
  }];
  const draws = [{ issue: "2026068", reds: [3, 5, 16, 18, 29, 32], blue: 4, prizes: {} }];

  assert.deepEqual(calculateWinningStats(records, draws, "30d", NOW), {
    winCount: 1,
    totalAmount: 0,
    unresolvedAmountCount: 1,
  });
});

test("fortune prize is only available when pool money is at least 300 million", () => {
  const line = { reds: [12, 14, 18, 25, 29, 32], blue: 13 };
  const draw = { issue: "2026078", reds: [1, 4, 14, 18, 25, 28], blue: 4 };

  assert.equal(evaluateLine(line, { ...draw, poolMoney: 299999999 }), "未中奖");
  assert.equal(evaluateLine(line, { ...draw, poolMoney: 300000000 }), "福运奖");
});

test("2026077 third generated line is manually treated as not winning", () => {
  assert.equal(
    evaluateLine(
      { reds: [12, 14, 18, 25, 29, 32], blue: 13 },
      { issue: "2026077", reds: [1, 4, 5, 14, 18, 25], blue: 4, poolMoney: 320076738 },
    ),
    "未中奖",
  );
});

test("official prize rows are normalized to prize names and numeric amounts", () => {
  assert.deepEqual(normalizePrizeRows([
    { type: 1, typemoney: "5,649,404" },
    { type: "2", typemoney: 295664 },
    { type: 3, typemoney: "0" },
  ]), {
    一等奖: 5649404,
    二等奖: 295664,
  });
});

test("synced prize data is merged into the matching draw without losing balls", () => {
  const draws = [{ issue: "2026068", reds: [3, 5, 16, 18, 29, 32], blue: 4 }];
  const prizeRows = [{
    issue: "2026068",
    prizes: [{ type: 1, typemoney: 5649404 }, { type: 2, typemoney: 295664 }],
  }];

  assert.deepEqual(mergePrizeData(draws, prizeRows), [{
    issue: "2026068",
    reds: [3, 5, 16, 18, 29, 32],
    blue: 4,
    prizes: { 一等奖: 5649404, 二等奖: 295664 },
  }]);
});

test("html draw list rows are parsed into normalized draw records", () => {
  const html = `
    <table>
      <tr>
        <td>2026069</td>
        <td>2026-06-18</td>
        <td>
          <p class="ball flex big">
            <b class="rbl fred">12</b><b class="rbl fred">14</b><b class="rbl fred">16</b>
            <b class="rbl fred">17</b><b class="rbl fred">18</b><b class="rbl fred">32</b>
            <b class="bbl fblue">08</b>
          </p>
        </td>
      </tr>
    </table>
  `;

  assert.deepEqual(parseHtmlDraws(html), [{
    issue: "2026069",
    date: "2026-06-18",
    reds: [12, 14, 16, 17, 18, 32],
    blue: 8,
    prizes: {},
  }]);
});
