const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash } = require("node:crypto");

const APP_JS = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function loadGeneratorApi(overrides = {}) {
  const noopElement = {
    addEventListener() {},
    append() {},
    classList: { toggle() {} },
    contains() { return true; },
    focus() {},
    getAttribute() { return "false"; },
    querySelector() { return noopElement; },
    setAttribute() {},
  };
  const context = {
    document: {
      activeElement: noopElement,
      addEventListener() {},
      createElement() { return { ...noopElement }; },
      querySelector() { return noopElement; },
      querySelectorAll() { return []; },
    },
    HistoryUtils: {
      calculateWinningStats() { return { winCount: 0, totalAmount: 0, unresolvedAmountCount: 0 }; },
      evaluateLine() { return "未开奖"; },
      filterHistory(records) { return records; },
      matchedNumbers() { return { reds: [], blue: false }; },
      normalizePrizeRows() { return []; },
      paginateHistory(records) { return records; },
      recordTimestamp(record) { return Date.parse(record?.betAt || "") || 0; },
    },
    localStorage: {
      getItem() { return null; },
      setItem() {},
    },
  };
  const source = `${APP_JS.replace(/\nbindEvents\(\);[\s\S]*$/, "")}
globalThis.__testApi = { generateAiLines, handleAiPick, randomInt, getBetIssue, handleBet, repairHistoryIssueMismatches, state };`;

  Object.assign(context, overrides);
  vm.runInNewContext(source, context);
  return context.__testApi;
}

function seededCrypto(seed = 12345) {
  return {
    getRandomValues(values) {
      values[0] = createHash("sha256").update(String(seed++)).digest().readUInt32LE(0);
      return values;
    },
  };
}

function assertStrategy(lines) {
  assert.equal(lines.length, 3);
  assert.equal(new Set(lines.flatMap((line) => Array.from(line.reds))).size, 18);
  assert.equal(new Set(lines.map((line) => line.blue)).size, 3);
  for (const line of lines) {
    assert.equal(line.reds.length, 6);
    assert.ok(line.reds.every((num) => Number.isInteger(num) && num >= 1 && num <= 33));
    assert.deepEqual(Array.from(line.reds), Array.from(line.reds).sort((a, b) => a - b));
    assert.ok(Number.isInteger(line.blue) && line.blue >= 1 && line.blue <= 16);
  }
  assert.ok(lines.slice(0, 2).every((line) => line.type === "ai" && line.blue >= 2));
  assert.deepEqual(Array.from(lines[2].reds), [1, 14, 17, 18, 22, 26]);
  assert.equal(lines[2].blue, 1);
  assert.equal(lines[2].type, "fixed");
}

test("draw history loads the same-origin synced data before external sources", () => {
  assert.match(APP_JS, /const LOCAL_DATA_URL = "\.\/data\/lottery_history\.json";/);
  assert.match(APP_JS, /const DATA_SOURCES = \[LOCAL_DATA_URL, DATA_URL, CDN_DATA_URL, HTML_DATA_URL, OFFICIAL_DATA_URL\];/);
});

test("pick button generates disjoint reds and distinct blues across 1000 batches", () => {
  const { handleAiPick, state } = loadGeneratorApi({ crypto: seededCrypto() });
  const seenReds = [new Set(), new Set()];
  const seenBlues = [new Set(), new Set()];
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    handleAiPick();
    assertStrategy(state.currentLines);
    assert.equal(state.generatedLine, state.currentLines[0]);
    state.currentLines.slice(0, 2).forEach((line, index) => {
      line.reds.forEach((num) => seenReds[index].add(num));
      seenBlues[index].add(line.blue);
    });
  }
  assert.deepEqual(seenReds.map((set) => set.size), [27, 27]);
  assert.deepEqual(seenBlues.map((set) => set.size), [15, 15]);
});

test("generation does not depend on past draws or alter saved history", () => {
  const left = loadGeneratorApi({ crypto: seededCrypto() });
  const right = loadGeneratorApi({ crypto: seededCrypto() });
  const history = [{ issue: "2026082", lines: [{ reds: [2, 4, 6, 8, 10, 12], blue: 2 }] }];
  right.state.draws = [{ issue: "2026100", reds: [2, 3, 4, 5, 6, 7], blue: 16 }];
  right.state.latestDraw = right.state.draws[0];
  right.state.history = structuredClone(history);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    assert.equal(JSON.stringify(left.generateAiLines()), JSON.stringify(right.generateAiLines()));
  }
  assert.deepEqual(right.state.history, history);
});

test("valid consecutive reds and birthday-only lines are not filtered out", () => {
  const values = [
    ...Array.from({ length: 26 }, (_, index) => 26 - index),
    ...Array.from({ length: 14 }, (_, index) => 14 - index),
  ];
  const { generateAiLines } = loadGeneratorApi({
    crypto: { getRandomValues(array) {
      assert.ok(values.length > 0, "generation should not retry based on number patterns");
      array[0] = values.shift();
      return array;
    } },
  });
  const lines = generateAiLines();
  assertStrategy(lines);
  assert.deepEqual(Array.from(lines[0].reds), [2, 3, 4, 5, 6, 7]);
  assert.deepEqual(Array.from(lines[1].reds), [8, 9, 10, 11, 12, 13]);
});

test("integer sampling rejects the partial crypto bucket", () => {
  const values = [4294967295, 26, 0];
  const { randomInt } = loadGeneratorApi({
    crypto: { getRandomValues(array) { array[0] = values.shift(); return array; } },
  });
  assert.equal(randomInt(0, 26), 26);
  assert.equal(randomInt(2, 16), 2);
  assert.equal(values.length, 0);
});

test("generation supports browsers without crypto and returns fresh fixed reds", () => {
  const { generateAiLines } = loadGeneratorApi();
  const first = generateAiLines();
  assertStrategy(first);
  first[2].reds[0] = 33;
  assertStrategy(generateAiLines());
});

test("bet issue is not calculated before latest draw data is loaded", () => {
  const { getBetIssue, state } = loadGeneratorApi();

  state.latestDraw = null;

  assert.equal(getBetIssue(Date.parse("2026-07-17T12:00:00+08:00")), "");
});

test("bet issue uses the synced latest draw for the next draw", () => {
  const { getBetIssue, state } = loadGeneratorApi();

  state.latestDraw = { issue: "2026081", date: "2026-07-16" };
  state.draws = [{ issue: "2026081", date: "2026-07-16", reds: [1, 2, 3, 4, 5, 6], blue: 7 }];

  assert.equal(getBetIssue(Date.parse("2026-07-17T12:00:00+08:00")), "2026082");
});

test("saved fallback issue is repaired after draw data loads", () => {
  const { repairHistoryIssueMismatches, state } = loadGeneratorApi();

  state.latestDraw = { issue: "2026081", date: "2026-07-16" };
  state.draws = [
    { issue: "2026081", date: "2026-07-16", reds: [1, 2, 3, 4, 5, 6], blue: 7 },
    { issue: "2026061", date: "2026-05-31", reds: [1, 2, 3, 4, 5, 6], blue: 7 },
  ];
  state.history = [
    {
      id: "bad",
      issue: "2026061",
      betAt: "2026-07-17T12:00:00+08:00",
      lines: [{ reds: [1, 14, 17, 18, 22, 26], blue: 1 }],
    },
    {
      id: "legit",
      issue: "2026061",
      betAt: "2026-05-31T12:00:00+08:00",
      lines: [{ reds: [1, 2, 3, 4, 5, 6], blue: 7 }],
    },
  ];

  assert.equal(repairHistoryIssueMismatches(), true);
  assert.equal(state.history.find((record) => record.id === "bad").issue, "2026082");
  assert.equal(state.history.find((record) => record.id === "legit").issue, "2026061");
});

test("bet history is not saved before latest draw data is loaded", () => {
  const { handleBet, state } = loadGeneratorApi();

  state.latestDraw = null;
  state.loadingDraw = true;
  state.currentLines = [{ reds: [1, 14, 17, 18, 22, 26], blue: 1, type: "fixed" }];

  handleBet();

  assert.equal(state.history.length, 0);
});
