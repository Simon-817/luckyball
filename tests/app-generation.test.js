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
globalThis.__testApi = {
  generateAiLines,
  handleAiPick,
  randomInt,
  getBetIssue,
  handleBet,
  repairHistoryIssueMismatches,
  sampleConsecutivePattern,
  sampleRunZone,
  classifyConsecutiveReds,
  matchesConsecutiveTarget,
  generateRedsForTarget,
  state,
};`;

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

test("pick button generates valid probability-shaped reds and distinct blues across 1000 batches", () => {
  const { handleAiPick, classifyConsecutiveReds, state } = loadGeneratorApi({ crypto: seededCrypto() });
  const seenPatterns = new Set();
  const seenBlues = [new Set(), new Set()];
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    handleAiPick();
    assertStrategy(state.currentLines);
    assert.equal(state.generatedLine, state.currentLines[0]);
    state.currentLines.slice(0, 2).forEach((line, index) => {
      seenPatterns.add(classifyConsecutiveReds(line.reds).patternId);
      seenBlues[index].add(line.blue);
    });
  }
  assert.deepEqual(seenBlues.map((set) => set.size), [15, 15]);
  assert.ok(seenPatterns.has("none"));
  assert.ok(seenPatterns.has("onePair"));
  assert.ok(seenPatterns.has("twoPairs"));
  assert.ok(seenPatterns.has("oneTriple"));
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

test("pattern weights use the requested ten-thousandth boundaries", () => {
  const rolls = [1, 3486, 7913, 8961, 8984, 9895, 9995];
  const expected = ["none", "onePair", "twoPairs", "threePairs", "oneTriple", "oneQuad", "oneQuint"];
  rolls.forEach((roll, index) => {
    const { sampleConsecutivePattern } = loadGeneratorApi({
      crypto: { getRandomValues(values) { values[0] = roll - 1; } },
    });
    assert.equal(sampleConsecutivePattern().id, expected[index]);
  });
});

test("run zones use the exact historical occurrence weights", () => {
  const cases = [
    [2, [1, 739, 1439, 2170], ["low", "mid", "high", "cross"]],
    [3, [1, 85, 191, 273], ["low", "mid", "high", "cross"]],
    [4, [1, 10, 18, 27], ["low", "mid", "high", "cross"]],
    [5, [1, 2], ["low", "cross"]],
  ];
  cases.forEach(([runLength, rolls, expected]) => {
    rolls.forEach((roll, index) => {
      const { sampleRunZone } = loadGeneratorApi({
        crypto: { getRandomValues(values) { values[0] = roll - 1; } },
      });
      assert.equal(sampleRunZone(runLength), expected[index]);
    });
  });
});

test("red construction honors every supported consecutive structure", () => {
  const api = loadGeneratorApi({ crypto: seededCrypto(7000) });
  const targets = [
    { patternId: "none", runLength: 1, runCount: 0, zones: [] },
    { patternId: "onePair", runLength: 2, runCount: 1, zones: ["low"] },
    { patternId: "twoPairs", runLength: 2, runCount: 2, zones: ["low", "mid"] },
    { patternId: "threePairs", runLength: 2, runCount: 3, zones: ["low", "mid", "high"] },
    { patternId: "oneTriple", runLength: 3, runCount: 1, zones: ["cross"] },
    { patternId: "oneQuad", runLength: 4, runCount: 1, zones: ["mid"] },
    { patternId: "oneQuint", runLength: 5, runCount: 1, zones: ["cross"] },
  ];
  targets.forEach((target) => {
    const reds = api.generateRedsForTarget(target);
    assert.ok(reds, `failed to construct ${target.patternId}`);
    assert.equal(api.matchesConsecutiveTarget(reds, target), true);
  });
});

test("red construction avoids other lines first and relaxes only when required", () => {
  const blocked = [1, 14, 17, 18, 22, 26];
  const api = loadGeneratorApi({ crypto: seededCrypto(9000) });
  const feasible = { patternId: "onePair", runLength: 2, runCount: 1, zones: ["low"] };
  const disjoint = api.generateRedsForTarget(feasible, blocked);
  assert.equal(disjoint.filter((num) => blocked.includes(num)).length, 0);

  const forced = { patternId: "oneQuad", runLength: 4, runCount: 1, zones: ["mid"] };
  const relaxed = api.generateRedsForTarget(forced, blocked);
  assert.ok(relaxed.filter((num) => blocked.includes(num)).length >= 1);
  assert.equal(api.matchesConsecutiveTarget(relaxed, forced), true);
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
