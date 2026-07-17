const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const APP_JS = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function loadGeneratorApi() {
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
globalThis.__testApi = { generateAiLines, redOverlapCount, getBetIssue, handleBet, repairHistoryIssueMismatches, state };`;

  vm.runInNewContext(source, context);
  return context.__testApi;
}

function countBetween(nums, min, max) {
  return nums.filter((num) => num >= min && num <= max).length;
}

test("AI pick flow generates three strategy lines without fixed picks", () => {
  assert.match(APP_JS, /const CURRENT_PICK_COUNT = 3;/);
  assert.match(APP_JS, /function generateAiLines\(count = CURRENT_PICK_COUNT\)/);
  assert.match(APP_JS, /const lines = generateAiLines\(\);/);
  assert.match(APP_JS, /state\.generatedLine = lines\[0\];/);
  assert.match(APP_JS, /state\.currentLines = lines;/);
  assert.doesNotMatch(APP_JS, /const FIXED_LINES/);
  assert.doesNotMatch(APP_JS, /FIXED_LINES\.map/);
});

test("draw history loads the same-origin synced data before external sources", () => {
  assert.match(APP_JS, /const LOCAL_DATA_URL = "\.\/data\/lottery_history\.json";/);
  assert.match(APP_JS, /const DATA_SOURCES = \[LOCAL_DATA_URL, DATA_URL, CDN_DATA_URL, HTML_DATA_URL, OFFICIAL_DATA_URL\];/);
});

test("AI pick flow diversifies the three generated lines as a group", () => {
  assert.match(APP_JS, /const MAX_SHARED_REDS_PER_LINE = 2;/);
  assert.match(APP_JS, /const MAX_RED_APPEARANCES_PER_PICK = 2;/);
  assert.match(APP_JS, /const STRATEGY_LINE_PROFILES = /);
  assert.match(APP_JS, /function buildStructuredLine\(settings, profile, selectedLines\)/);
  assert.match(APP_JS, /function redOverlapCount\(left, right\)/);
  assert.match(APP_JS, /function redAppearanceMap\(lines\)/);
  assert.match(APP_JS, /function isDiverseCandidate\(candidate, selectedLines\)/);
  assert.match(APP_JS, /function lineDiversityPenalty\(candidate, selectedLines\)/);
  assert.match(APP_JS, /function chooseDiverseCandidate\(candidates, selectedLines, targetShadowCount = null\)/);
  assert.match(APP_JS, /function chooseGroupLine\(settings, selectedLines, targetShadowCount = chooseTargetShadowCount\(\)\)/);
  assert.match(APP_JS, /redOverlapCount\(candidate\.reds, line\.reds\) <= MAX_SHARED_REDS_PER_LINE/);
  assert.match(APP_JS, /count <= MAX_RED_APPEARANCES_PER_PICK/);
  assert.match(APP_JS, /candidates\.filter\(\(candidate\) => isDiverseCandidate\(candidate, selectedLines\)\)/);
  assert.match(APP_JS, /chooseGroupLine\(settings, lines\)/);
});

test("AI pick flow follows the requested three-line strategy structure", () => {
  const { generateAiLines, redOverlapCount } = loadGeneratorApi();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const lines = generateAiLines();
    assert.equal(lines.length, 3);

    const blueValues = lines.map((line) => line.blue);
    assert.equal(new Set(blueValues).size, 3);
    assert.ok(lines[0].blue >= 1 && lines[0].blue <= 5);
    assert.ok(lines[1].blue >= 6 && lines[1].blue <= 11);
    assert.equal(lines[2].blue, 1);
    assert.deepEqual(Array.from(lines[2].reds), [1, 14, 17, 18, 22, 26]);
    assert.equal(lines[2].type, "fixed");

    assert.equal(countBetween(lines[0].reds, 1, 11), 2);
    assert.equal(countBetween(lines[0].reds, 12, 22), 2);
    assert.equal(countBetween(lines[0].reds, 23, 33), 2);

    assert.equal(redOverlapCount(lines[0].reds, lines[1].reds), 0);
    assert.ok(redOverlapCount(lines[0].reds, lines[2].reds) <= 2);
    assert.ok(redOverlapCount(lines[1].reds, lines[2].reds) <= 2);

    assert.ok(lines[1].reds.every((num) => !lines[0].reds.includes(num)));
    assert.ok(lines.some((line) => line.reds.includes(32) || line.reds.includes(33)));
  }
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
