const RED_MIN = 1;
const RED_MAX = 33;
const BLUE_MIN = 1;
const BLUE_MAX = 16;
const HISTORY_WINDOW = 30;
const HISTORY_PAGE_SIZE = 12;
const HISTORY_FILTER_LABELS = {
  "30d": "近30天",
  "6m": "近半年",
  "1y": "近1年",
  all: "全部",
};
const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000;
const STORAGE_KEY = "ssq-bet-history-v1";
const RESTORED_HISTORY_MARKER_KEY = globalThis.RestoredHistory?.RESTORED_HISTORY_MARKER_KEY;
const LOCAL_DATA_URL = "./data/lottery_history.json";
const DATA_URL =
  "https://raw.githubusercontent.com/sinyu1012/Double-Color-Ball-AI/main/data/lottery_history.json";
const CDN_DATA_URL =
  "https://cdn.jsdelivr.net/gh/sinyu1012/Double-Color-Ball-AI@main/data/lottery_history.json";
const OFFICIAL_DATA_URL =
  "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=&issueStart=&issueEnd=&dayStart=&dayEnd=&pageNo=1&pageSize=30&week=&systemType=PC";
const HTML_DATA_URL = "https://www.17500.cn/kj/list-ssq.html";
const DATA_SOURCES = [LOCAL_DATA_URL, DATA_URL, CDN_DATA_URL, HTML_DATA_URL, OFFICIAL_DATA_URL];
const PRIZE_DATA_URL = "./data/lottery_prizes.json";
const CURRENT_PICK_COUNT = 3;
const FIXED_THIRD_LINE = { reds: [1, 14, 17, 18, 22, 26], blue: 1 };
const CONSECUTIVE_PATTERN_WEIGHTS = [
  { id: "none", weight: 3485, runLength: 1, runCount: 0 },
  { id: "onePair", weight: 4427, runLength: 2, runCount: 1 },
  { id: "twoPairs", weight: 1048, runLength: 2, runCount: 2 },
  { id: "threePairs", weight: 23, runLength: 2, runCount: 3 },
  { id: "oneTriple", weight: 911, runLength: 3, runCount: 1 },
  { id: "oneQuad", weight: 100, runLength: 4, runCount: 1 },
  { id: "oneQuint", weight: 6, runLength: 5, runCount: 1 },
];
const RUN_ZONE_WEIGHTS = {
  2: [
    { id: "low", weight: 738 },
    { id: "mid", weight: 700 },
    { id: "high", weight: 731 },
    { id: "cross", weight: 139 },
  ],
  3: [
    { id: "low", weight: 84 },
    { id: "mid", weight: 106 },
    { id: "high", weight: 82 },
    { id: "cross", weight: 47 },
  ],
  4: [
    { id: "low", weight: 9 },
    { id: "mid", weight: 8 },
    { id: "high", weight: 9 },
    { id: "cross", weight: 9 },
  ],
  5: [
    { id: "low", weight: 1 },
    { id: "cross", weight: 1 },
  ],
};

const FALLBACK_DRAWS = [
  { period: "26060", red_balls: ["07", "09", "10", "16", "22", "27"], blue_ball: "11", date: "2026-05-28" },
  { period: "26059", red_balls: ["08", "16", "26", "28", "29", "30"], blue_ball: "15", date: "2026-05-26" },
  { period: "26058", red_balls: ["01", "04", "07", "21", "29", "30"], blue_ball: "01", date: "2026-05-24" },
  { period: "26057", red_balls: ["01", "10", "22", "24", "28", "30"], blue_ball: "07", date: "2026-05-21" },
  { period: "26056", red_balls: ["10", "19", "21", "22", "31", "33"], blue_ball: "05", date: "2026-05-19" },
  { period: "26055", red_balls: ["04", "11", "24", "25", "32", "33"], blue_ball: "13", date: "2026-05-17" },
  { period: "26054", red_balls: ["13", "20", "25", "29", "30", "33"], blue_ball: "02", date: "2026-05-14" },
  { period: "26053", red_balls: ["01", "02", "03", "08", "13", "14"], blue_ball: "02", date: "2026-05-12" },
  { period: "26052", red_balls: ["01", "03", "11", "22", "26", "31"], blue_ball: "11", date: "2026-05-10" },
  { period: "26051", red_balls: ["09", "14", "15", "16", "29", "30"], blue_ball: "10", date: "2026-05-07" },
  { period: "26050", red_balls: ["06", "09", "25", "27", "28", "30"], blue_ball: "03", date: "2026-05-05" },
  { period: "26049", red_balls: ["03", "04", "14", "15", "18", "20"], blue_ball: "02", date: "2026-05-03" },
  { period: "26048", red_balls: ["09", "15", "18", "24", "28", "33"], blue_ball: "01", date: "2026-04-30" },
  { period: "26047", red_balls: ["07", "16", "21", "24", "27", "30"], blue_ball: "07", date: "2026-04-28" },
  { period: "26046", red_balls: ["02", "09", "10", "24", "31", "33"], blue_ball: "16", date: "2026-04-26" },
  { period: "26045", red_balls: ["04", "11", "15", "17", "24", "30"], blue_ball: "15", date: "2026-04-23" },
  { period: "26044", red_balls: ["02", "14", "17", "18", "22", "30"], blue_ball: "01", date: "2026-04-21" },
  { period: "26043", red_balls: ["06", "09", "14", "16", "25", "32"], blue_ball: "16", date: "2026-04-19" },
  { period: "26042", red_balls: ["02", "07", "12", "19", "24", "31"], blue_ball: "10", date: "2026-04-16" },
  { period: "26041", red_balls: ["02", "08", "10", "17", "19", "24"], blue_ball: "13", date: "2026-04-14" },
  { period: "26040", red_balls: ["03", "04", "14", "22", "23", "33"], blue_ball: "04", date: "2026-04-12" },
  { period: "26039", red_balls: ["08", "17", "18", "21", "25", "30"], blue_ball: "05", date: "2026-04-09" },
  { period: "26038", red_balls: ["01", "02", "13", "23", "25", "27"], blue_ball: "05", date: "2026-04-07" },
  { period: "26037", red_balls: ["11", "22", "27", "29", "31", "33"], blue_ball: "12", date: "2026-04-05" },
  { period: "26036", red_balls: ["06", "10", "12", "15", "22", "28"], blue_ball: "08", date: "2026-04-02" },
  { period: "26035", red_balls: ["02", "06", "12", "24", "25", "32"], blue_ball: "02", date: "2026-03-31" },
  { period: "26034", red_balls: ["01", "03", "07", "13", "22", "23"], blue_ball: "07", date: "2026-03-29" },
  { period: "26033", red_balls: ["03", "06", "13", "21", "28", "29"], blue_ball: "06", date: "2026-03-26" },
  { period: "26032", red_balls: ["01", "03", "11", "18", "31", "33"], blue_ball: "02", date: "2026-03-24" },
  { period: "26031", red_balls: ["03", "10", "12", "13", "18", "33"], blue_ball: "08", date: "2026-03-22" },
  { period: "26030", red_balls: ["10", "11", "14", "19", "22", "24"], blue_ball: "04", date: "2026-03-19" },
  { period: "26029", red_balls: ["06", "19", "22", "23", "28", "31"], blue_ball: "05", date: "2026-03-17" },
];

const state = {
  draws: [],
  latestDraw: null,
  generatedLine: null,
  currentLines: [],
  history: [],
  historyFilter: "30d",
  historyPage: 1,
  deleteMode: false,
  historyObserver: null,
  loadingDraw: false,
  countdownTimer: null,
};

const els = {
  dateLabel: document.querySelector("#dateLabel"),
  generatorBalls: document.querySelector("#generatorBalls"),
  aiPickBtn: document.querySelector("#aiPickBtn"),
  currentBetList: document.querySelector("#currentBetList"),
  betBtn: document.querySelector("#betBtn"),
  countdown: document.querySelector("#countdown"),
  latestDrawCard: document.querySelector("#latestDrawCard"),
  historyList: document.querySelector("#historyList"),
  historyFilter: document.querySelector("#historyFilter"),
  historyFilterTrigger: document.querySelector("#historyFilterTrigger"),
  historyFilterLabel: document.querySelector("#historyFilterLabel"),
  historyFilterMenu: document.querySelector("#historyFilterMenu"),
  historyFilterOptions: [...document.querySelectorAll("#historyFilterMenu [role='option']")],
  deleteToggle: document.querySelector("#deleteToggle"),
  winningCount: document.querySelector("#winningCount"),
  winningAmount: document.querySelector("#winningAmount"),
  winningStatsNote: document.querySelector("#winningStatsNote"),
};

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function randomInt(min, max) {
  const span = max - min + 1;
  const cryptoSource = globalThis.crypto;
  if (!cryptoSource?.getRandomValues) {
    return Math.floor(Math.random() * span) + min;
  }

  // Reject the incomplete bucket so each integer has equal probability.
  const limit = 4294967296 - (4294967296 % span);
  const values = new Uint32Array(1);
  do {
    cryptoSource.getRandomValues(values);
  } while (values[0] >= limit);
  return min + (values[0] % span);
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function toNumber(value) {
  return Number(String(value).replace(/\D/g, ""));
}

function normalizeIssue(period) {
  const raw = String(period || "");
  if (raw.length === 5) return `20${raw}`;
  return raw;
}

function normalizeDate(dateText) {
  const match = String(dateText || "").match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
  if (!match) return "";
  const [year, month, day] = match[0].replace(/\//g, "-").split("-").map(Number);
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseBallList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "").split(/[,\s]+/);
}

function normalizeDraw(raw) {
  const reds = parseBallList(raw.red_balls || raw.reds || raw.red || raw.frontWinningNum)
    .map(toNumber)
    .filter((num) => num >= RED_MIN && num <= RED_MAX)
    .sort((a, b) => a - b);
  const blue = toNumber(raw.blue_ball || raw.blue || raw.backWinningNum);

  return {
    issue: normalizeIssue(raw.period || raw.issue || raw.code),
    date: normalizeDate(raw.date || raw.openTime),
    reds,
    blue,
    poolMoney: toNumber(raw.poolMoney || raw.poolmoney),
    prizes: HistoryUtils.normalizePrizeRows(raw.prizegrades || raw.prizes),
  };
}

function normalizeHistory(payload, options = {}) {
  const { requireWindow = true } = options;
  const rows = Array.isArray(payload) ? payload : payload.data || payload.result;
  if (!Array.isArray(rows)) throw new Error("开奖记录格式不正确");

  const draws = rows
    .map(normalizeDraw)
    .filter((draw) => draw.reds.length === 6 && draw.blue >= BLUE_MIN && draw.blue <= BLUE_MAX)
    .sort((a, b) => Number(b.issue) - Number(a.issue));

  if (requireWindow && draws.length < HISTORY_WINDOW) throw new Error("最近30期数据不足");
  return draws;
}

function parseDataSourcePayload(text, contentType = "") {
  const trimmed = String(text || "").trim();
  if (contentType.includes("json") || /^[\[{]/.test(trimmed)) {
    return normalizeHistory(JSON.parse(trimmed), { requireWindow: false });
  }

  const draws = HistoryUtils.parseHtmlDraws(trimmed);
  if (!draws.length) throw new Error("HTML开奖记录格式不正确");
  return normalizeHistory(draws, { requireWindow: false });
}

function appendCacheBust(url) {
  return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}

function mergeDrawSets(drawSets) {
  const byIssue = new Map();

  drawSets.flat().forEach((draw) => {
    if (draw.issue) byIssue.set(draw.issue, draw);
  });

  return [...byIssue.values()].sort((a, b) => Number(b.issue) - Number(a.issue));
}

async function fetchDataSource(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(appendCacheBust(url), { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`接口响应 ${response.status}`);
    return parseDataSourcePayload(await response.text(), response.headers.get("content-type") || "");
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLotteryHistory() {
  const fallbackDraws = normalizeHistory(FALLBACK_DRAWS);
  const settled = await Promise.allSettled(DATA_SOURCES.map(fetchDataSource));
  const remoteDrawSets = settled.map((result) => (result.status === "fulfilled" ? result.value : []));
  const merged = mergeDrawSets([fallbackDraws, ...remoteDrawSets]);

  if (merged.length < HISTORY_WINDOW) throw new Error("可用开奖记录不足");
  return merged;
}

async function fetchPrizeHistory() {
  const response = await fetch(appendCacheBust(PRIZE_DATA_URL), { cache: "no-store" });
  if (!response.ok) throw new Error(`奖金数据响应 ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(rows)) throw new Error("奖金数据格式不正确");
  return rows;
}

function chinaParts(timestamp = Date.now()) {
  const date = new Date(timestamp + CHINA_OFFSET_MS);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    week: date.getUTCDay(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

function chinaTimestamp(year, month, day, hour = 0, minute = 0, second = 0) {
  return Date.UTC(year, month - 1, day, hour - 8, minute, second);
}

function parseChinaDate(dateText) {
  const [year, month, day] = String(dateText).split("-").map(Number);
  return { year, month, day };
}

function addChinaDays(parts, offset) {
  const timestamp = chinaTimestamp(parts.year, parts.month, parts.day + offset);
  return chinaParts(timestamp);
}

function formatChinaDate(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function isDrawWeekday(week) {
  return week === 2 || week === 4 || week === 0;
}

function getNextDraw(timestamp = Date.now()) {
  const today = chinaParts(timestamp);

  for (let offset = 0; offset < 10; offset += 1) {
    const candidate = addChinaDays(today, offset);
    if (!isDrawWeekday(candidate.week)) continue;
    const drawAt = chinaTimestamp(candidate.year, candidate.month, candidate.day, 21, 15, 0);
    if (drawAt > timestamp) {
      return { timestamp: drawAt, parts: candidate };
    }
  }

  return null;
}

function countDrawSlotsAfterLatest(targetTimestamp) {
  if (!state.latestDraw?.date) return 1;
  return countDrawSlotsAfterDate(state.latestDraw.date, targetTimestamp);
}

function countDrawSlotsAfterDate(dateText, targetTimestamp) {
  const latestDate = parseChinaDate(dateText);
  const latestTimestamp = chinaTimestamp(latestDate.year, latestDate.month, latestDate.day, 21, 15, 0);
  let count = 0;

  for (let offset = 1; offset <= 45; offset += 1) {
    const candidate = addChinaDays(latestDate, offset);
    if (!isDrawWeekday(candidate.week)) continue;
    const drawAt = chinaTimestamp(candidate.year, candidate.month, candidate.day, 21, 15, 0);
    if (drawAt > targetTimestamp) break;
    if (drawAt > latestTimestamp) count += 1;
  }

  return Math.max(1, count);
}

function drawTimestamp(draw) {
  if (!draw?.date) return 0;
  const parts = parseChinaDate(draw.date);
  return chinaTimestamp(parts.year, parts.month, parts.day, 21, 15, 0);
}

function issueForDrawAt(drawAt) {
  const drawDate = formatChinaDate(chinaParts(drawAt));
  const knownDraw = state.draws.find((draw) => draw.date === drawDate);
  if (knownDraw?.issue) return knownDraw.issue;

  const anchor = state.draws
    .filter((draw) => draw.issue && draw.date && drawTimestamp(draw) < drawAt)
    .sort((left, right) => drawTimestamp(right) - drawTimestamp(left))[0];
  if (!anchor?.issue || !anchor.date) return "";

  return String(Number(anchor.issue) + countDrawSlotsAfterDate(anchor.date, drawAt));
}

function countElapsedDrawSlotsAfterLatest(targetTimestamp = Date.now()) {
  if (!state.latestDraw?.date) return 0;
  const latestDate = parseChinaDate(state.latestDraw.date);
  const latestTimestamp = chinaTimestamp(latestDate.year, latestDate.month, latestDate.day, 21, 15, 0);
  let count = 0;

  for (let offset = 1; offset <= 45; offset += 1) {
    const candidate = addChinaDays(latestDate, offset);
    if (!isDrawWeekday(candidate.week)) continue;
    const drawAt = chinaTimestamp(candidate.year, candidate.month, candidate.day, 21, 15, 0);
    if (drawAt > targetTimestamp) break;
    if (drawAt > latestTimestamp) count += 1;
  }

  return count;
}

function getExpectedLatestIssue(timestamp = Date.now()) {
  const latestIssue = Number(state.latestDraw?.issue || normalizeDraw(FALLBACK_DRAWS[0]).issue);
  return String(latestIssue + countElapsedDrawSlotsAfterLatest(timestamp));
}

function getBetIssue(timestamp = Date.now()) {
  if (!state.latestDraw?.issue || !state.latestDraw?.date) return "";
  const nextDraw = getNextDraw(timestamp);
  return nextDraw ? issueForDrawAt(nextDraw.timestamp) : "";
}

function formatDateLabel(timestamp = Date.now()) {
  const parts = chinaParts(timestamp);
  const weeks = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${weeks[parts.week]}`;
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInt(0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function weightedChoice(options) {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = randomInt(1, totalWeight);
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }
  return options[options.length - 1];
}

function sampleConsecutivePattern() {
  return weightedChoice(CONSECUTIVE_PATTERN_WEIGHTS);
}

function sampleRunZone(runLength) {
  return weightedChoice(RUN_ZONE_WEIGHTS[runLength]).id;
}

function consecutiveRuns(reds) {
  const sorted = [...reds].sort((left, right) => left - right);
  const runs = [];
  let current = [sorted[0]];
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] === sorted[index - 1] + 1) {
      current.push(sorted[index]);
      continue;
    }
    if (current.length >= 2) runs.push(current);
    current = [sorted[index]];
  }
  if (current.length >= 2) runs.push(current);
  return runs;
}

function runZone(run) {
  if (run.every((num) => num <= 11)) return "low";
  if (run.every((num) => num >= 12 && num <= 22)) return "mid";
  if (run.every((num) => num >= 23)) return "high";
  return "cross";
}

function classifyConsecutiveReds(reds) {
  const runs = consecutiveRuns(reds);
  if (!runs.length) return { patternId: "none", runs, maxRunLength: 1 };

  const maxRunLength = Math.max(...runs.map((run) => run.length));
  const maxRuns = runs.filter((run) => run.length === maxRunLength);
  let patternId = "unsupported";
  if (maxRunLength === 2 && maxRuns.length >= 1 && maxRuns.length <= 3) {
    patternId = ["", "onePair", "twoPairs", "threePairs"][maxRuns.length];
  } else if (maxRunLength === 3 && maxRuns.length === 1) {
    patternId = "oneTriple";
  } else if (maxRunLength === 4 && maxRuns.length === 1) {
    patternId = "oneQuad";
  } else if (maxRunLength === 5 && maxRuns.length === 1) {
    patternId = "oneQuint";
  }
  return { patternId, runs, maxRunLength };
}

function sameZoneMultiset(actual, expected) {
  return [...actual].sort().join(",") === [...expected].sort().join(",");
}

function matchesConsecutiveTarget(reds, target) {
  const classification = classifyConsecutiveReds(reds);
  if (classification.patternId !== target.patternId) return false;
  if (target.patternId === "none") return true;
  const targetZones = classification.runs
    .filter((run) => run.length === target.runLength)
    .map(runZone);
  return sameZoneMultiset(targetZones, target.zones);
}

function possibleRunStarts(runLength, zone, allowed) {
  const starts = [];
  for (let start = RED_MIN; start <= RED_MAX - runLength + 1; start += 1) {
    const run = range(start, start + runLength - 1);
    if (runZone(run) === zone && run.every((num) => allowed.has(num))) starts.push(start);
  }
  return starts;
}

function tryGenerateReds(target, allowedNumbers, blockedNumbers, maxOverlap, maxAttempts = 500) {
  if (allowedNumbers.length < 6) return null;
  const allowed = new Set(allowedNumbers);
  const blocked = new Set(blockedNumbers);
  const startPools = new Map();
  for (const zone of new Set(target.zones)) {
    const starts = possibleRunStarts(target.runLength, zone, allowed);
    if (!starts.length) return null;
    startPools.set(zone, starts);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const selected = new Set();
    let validRuns = true;
    for (const zone of shuffled(target.zones)) {
      const starts = startPools.get(zone).filter((start) =>
        range(start, start + target.runLength - 1).every((num) => !selected.has(num))
      );
      if (!starts.length) {
        validRuns = false;
        break;
      }
      const start = starts[randomInt(0, starts.length - 1)];
      range(start, start + target.runLength - 1).forEach((num) => selected.add(num));
    }
    if (!validRuns || selected.size > 6) continue;

    const remaining = shuffled(allowedNumbers.filter((num) => !selected.has(num)));
    const needed = 6 - selected.size;
    if (remaining.length < needed) continue;
    const reds = [...selected, ...remaining.slice(0, needed)].sort((left, right) => left - right);
    const overlap = reds.filter((num) => blocked.has(num)).length;
    if (overlap <= maxOverlap && matchesConsecutiveTarget(reds, target)) return reds;
  }
  return null;
}

function findMatchingCombination(target, allowedNumbers) {
  const candidates = shuffled(allowedNumbers);
  const length = candidates.length;
  if (length < 6) return null;
  for (let a = 0; a < length - 5; a += 1) {
    for (let b = a + 1; b < length - 4; b += 1) {
      for (let c = b + 1; c < length - 3; c += 1) {
        for (let d = c + 1; d < length - 2; d += 1) {
          for (let e = d + 1; e < length - 1; e += 1) {
            for (let f = e + 1; f < length; f += 1) {
              const reds = [candidates[a], candidates[b], candidates[c], candidates[d], candidates[e], candidates[f]]
                .sort((left, right) => left - right);
              if (matchesConsecutiveTarget(reds, target)) return reds;
            }
          }
        }
      }
    }
  }
  return null;
}

function generateRedsForTarget(target, blockedNumbers = []) {
  const allReds = range(RED_MIN, RED_MAX);
  const blocked = new Set(blockedNumbers);
  const withoutOverlap = allReds.filter((num) => !blocked.has(num));
  const disjoint = tryGenerateReds(target, withoutOverlap, blockedNumbers, 0);
  if (disjoint) return disjoint;
  const exhaustiveDisjoint = findMatchingCombination(target, withoutOverlap);
  if (exhaustiveDisjoint) return exhaustiveDisjoint;

  for (let maxOverlap = 1; maxOverlap <= 6; maxOverlap += 1) {
    const reds = tryGenerateReds(target, allReds, blockedNumbers, maxOverlap);
    if (reds) return reds;
  }
  return null;
}

function generateRedsForPattern(pattern, blockedNumbers) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const target = {
      patternId: pattern.id,
      runLength: pattern.runLength,
      runCount: pattern.runCount,
      zones: Array.from({ length: pattern.runCount }, () => sampleRunZone(pattern.runLength)),
    };
    const reds = generateRedsForTarget(target, blockedNumbers);
    if (reds) return reds;
  }
  throw new Error(`Unable to generate red balls for ${pattern.id}`);
}

function generateAiLines() {
  const blues = shuffled(range(BLUE_MIN, BLUE_MAX).filter((num) => num !== FIXED_THIRD_LINE.blue));
  const patterns = Array.from({ length: CURRENT_PICK_COUNT - 1 }, sampleConsecutivePattern);
  const lines = [];
  let blockedReds = [...FIXED_THIRD_LINE.reds];
  patterns.forEach((pattern, index) => {
    const reds = generateRedsForPattern(pattern, blockedReds);
    lines.push({ reds, blue: blues[index], type: "ai" });
    blockedReds = [...new Set([...blockedReds, ...reds])];
  });
  lines.push({
    reds: [...FIXED_THIRD_LINE.reds],
    blue: FIXED_THIRD_LINE.blue,
    type: "fixed",
  });
  return lines;
}

function makeBall(num, color, placeholder = false) {
  const node = document.createElement("span");
  node.className = `ball ${color}${placeholder ? " placeholder" : ""}`;
  node.textContent = placeholder ? "?" : pad(num);
  return node;
}

function formatReds(reds) {
  return reds.map(pad).join(" ");
}

function makeNumberRow(line, draw = null) {
  const row = document.createElement("div");
  row.className = "number-row";
  const hits = HistoryUtils.matchedNumbers(line, draw);

  line.reds.forEach((num) => {
    const ball = document.createElement("span");
    ball.className = `number-chip red${hits.reds.includes(num) ? " is-hit" : ""}`;
    ball.textContent = pad(num);
    row.append(ball);
  });

  const blue = document.createElement("span");
  blue.className = `number-chip blue${hits.blue ? " is-hit" : ""}`;
  blue.textContent = pad(line.blue);
  row.append(blue);
  return row;
}

function makeCurrentLine(line, index) {
  const node = document.createElement("div");
  node.className = `current-line${line.type === "ai" ? " is-generated" : ""}`;
  const label = document.createElement("span");
  label.className = "line-label";
  label.textContent = `第${index + 1}注（${line.type === "ai" ? "生成" : "固定"}）`;
  node.append(label, makeNumberRow(line));
  return node;
}

function renderGenerator() {
  els.generatorBalls.innerHTML = "";
  if (!state.generatedLine) {
    range(1, 6).forEach(() => els.generatorBalls.append(makeBall(null, "red", true)));
    els.generatorBalls.append(makeBall(null, "blue", true));
    return;
  }

  state.generatedLine.reds.forEach((num) => els.generatorBalls.append(makeBall(num, "red")));
  els.generatorBalls.append(makeBall(state.generatedLine.blue, "blue"));
}

function renderCurrentBet() {
  els.currentBetList.innerHTML = "";
  if (!state.currentLines.length) {
    els.currentBetList.innerHTML = `<p class="empty-copy">点击 AI选号 生成本期投注号码</p>`;
    els.betBtn.disabled = true;
    return;
  }

  state.currentLines.forEach((line, index) => els.currentBetList.append(makeCurrentLine(line, index)));
  els.betBtn.disabled = state.loadingDraw || !state.latestDraw;
}

function renderLatestDraw() {
  const expectedIssue = getExpectedLatestIssue();
  const draw = drawForIssue(expectedIssue) || state.latestDraw;
  if (!draw) {
    els.latestDrawCard.innerHTML = `<div class="draw-loading">正在同步最近一期开奖结果</div>`;
    return;
  }

  if (Number(expectedIssue) > Number(draw.issue)) {
    els.latestDrawCard.innerHTML = `
      <div class="draw-pending">
        <div class="draw-issue">第${expectedIssue}期</div>
        <p>正在获取最新开奖结果</p>
        <button class="draw-refresh" type="button"${state.loadingDraw ? " disabled" : ""}>
          ${state.loadingDraw ? "获取中" : "刷新"}
        </button>
      </div>
    `;
    els.latestDrawCard.querySelector(".draw-refresh")?.addEventListener("click", loadData);
    return;
  }

  els.latestDrawCard.innerHTML = `<div class="draw-issue">第${draw.issue}期</div>`;
  const balls = document.createElement("div");
  balls.className = "draw-balls";
  draw.reds.forEach((num) => balls.append(makeBall(num, "red")));
  balls.append(makeBall(draw.blue, "blue"));
  els.latestDrawCard.append(balls);
}

function statusClass(status) {
  if (status === "未开奖") return "pending";
  if (status === "未中奖") return "lose";
  return "win";
}

function drawForIssue(issue) {
  return state.draws.find((draw) => draw.issue === String(issue));
}

function renderWinningStats() {
  const stats = HistoryUtils.calculateWinningStats(state.history, state.draws, state.historyFilter);
  els.winningCount.textContent = `${stats.winCount}次`;
  els.winningAmount.textContent = stats.unresolvedAmountCount
    ? "待同步"
    : `¥${stats.totalAmount.toLocaleString("zh-CN")}`;
  els.winningStatsNote.hidden = stats.unresolvedAmountCount === 0;
}

function renderHistory() {
  renderWinningStats();
  els.deleteToggle.classList.toggle("is-active", state.deleteMode);
  els.deleteToggle.setAttribute("aria-label", state.deleteMode ? "完成删除" : "删除投注记录");
  const expectedLatestIssue = getExpectedLatestIssue();
  const filtered = HistoryUtils.filterHistory(state.history, state.historyFilter);
  const visible = HistoryUtils.paginateHistory(filtered, state.historyPage, HISTORY_PAGE_SIZE);

  state.historyObserver?.disconnect();
  els.historyList.innerHTML = "";

  if (!filtered.length) {
    els.historyList.innerHTML = `<div class="history-empty">该时间范围内暂无投注记录</div>`;
    return;
  }

  visible.forEach((record) => {
    const card = document.createElement("article");
    card.className = `history-card${state.deleteMode ? " delete-mode" : ""}`;
    card.innerHTML = `
      <div class="history-issue">第${record.issue}期</div>
      <button class="record-remove" type="button" aria-label="删除第${record.issue}期投注记录">
        <img src="./assets/delete.svg" alt="" aria-hidden="true" />
      </button>
    `;

    const draw = Number(record.issue) <= Number(expectedLatestIssue) ? drawForIssue(record.issue) : null;
    record.lines.forEach((line, index) => {
      const row = document.createElement("div");
      const status = Number(record.issue) > Number(expectedLatestIssue) || !draw
        ? "未开奖"
        : HistoryUtils.evaluateLine(line, draw);
      row.className = "history-line";
      const label = document.createElement("span");
      label.className = "history-line-label";
      label.textContent = `第${index + 1}注`;
      row.append(label, makeNumberRow(line, draw));
      const badge = document.createElement("span");
      badge.className = `status-badge ${statusClass(status)}`;
      badge.textContent = status;
      row.append(badge);
      card.append(row);
    });

    card.querySelector(".record-remove").addEventListener("click", () => {
      state.history = state.history.filter((item) => item.id !== record.id);
      saveHistory();
      renderHistory();
    });
    els.historyList.append(card);
  });

  if (visible.length < filtered.length) {
    const sentinel = document.createElement("div");
    sentinel.className = "history-load-sentinel";
    sentinel.textContent = "继续上滑加载更多";
    els.historyList.append(sentinel);
    state.historyObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        state.historyPage += 1;
        renderHistory();
      },
      { rootMargin: "240px 0px" },
    );
    state.historyObserver.observe(sentinel);
  } else if (filtered.length > HISTORY_PAGE_SIZE) {
    const end = document.createElement("div");
    end.className = "history-load-sentinel";
    end.textContent = "已加载全部记录";
    els.historyList.append(end);
  }
}

function renderDateAndCountdown() {
  els.dateLabel.textContent = formatDateLabel();
  const nextDraw = getNextDraw();
  els.countdown.textContent = nextDraw ? formatDuration(nextDraw.timestamp - Date.now()) : "--:--:--";
}

function renderAll() {
  renderGenerator();
  renderCurrentBet();
  renderLatestDraw();
  renderHistory();
  renderDateAndCountdown();
}

function loadHistory() {
  try {
    const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    state.history = Array.isArray(rows)
      ? rows.sort((left, right) => HistoryUtils.recordTimestamp(right) - HistoryUtils.recordTimestamp(left))
      : [];
  } catch {
    state.history = [];
  }

  const restoredRecords = globalThis.RestoredHistory?.RESTORED_HISTORY_RECORDS || [];
  if (
    !state.history.length &&
    restoredRecords.length &&
    RESTORED_HISTORY_MARKER_KEY &&
    !localStorage.getItem(RESTORED_HISTORY_MARKER_KEY)
  ) {
    state.history = restoredRecords.map((record) => ({
      ...record,
      lines: record.lines.map((line) => ({ ...line, reds: [...line.reds] })),
    }));
    saveHistory();
    if (RESTORED_HISTORY_MARKER_KEY) localStorage.setItem(RESTORED_HISTORY_MARKER_KEY, "1");
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
}

function repairHistoryIssueMismatches() {
  if (!state.draws.length) return false;
  let changed = false;

  state.history = state.history.map((record) => {
    const timestamp = HistoryUtils.recordTimestamp(record);
    if (!timestamp) return record;
    const expectedIssue = getBetIssue(timestamp);
    if (!expectedIssue || String(record.issue) === expectedIssue) return record;

    changed = true;
    return { ...record, issue: expectedIssue };
  });

  if (changed) {
    state.history.sort((left, right) => HistoryUtils.recordTimestamp(right) - HistoryUtils.recordTimestamp(left));
    saveHistory();
  }

  return changed;
}

function handleAiPick() {
  const lines = generateAiLines();
  state.generatedLine = lines[0];
  state.currentLines = lines;
  renderGenerator();
  renderCurrentBet();
}

function handleBet() {
  if (!state.currentLines.length || state.loadingDraw || !state.latestDraw) return;
  const now = Date.now();
  const issue = getBetIssue(now);
  if (!issue) return;
  const record = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    issue,
    betAt: new Date(now).toISOString(),
    lines: state.currentLines.map((line) => ({
      reds: [...line.reds],
      blue: line.blue,
      type: line.type,
    })),
  };

  state.history.unshift(record);
  state.historyPage = 1;
  saveHistory();
  state.generatedLine = null;
  state.currentLines = [];
  renderAll();
}

function toggleDeleteMode() {
  state.deleteMode = !state.deleteMode;
  renderHistory();
}

function setHistoryFilterOpen(open) {
  els.historyFilter.classList.toggle("is-open", open);
  els.historyFilterTrigger.setAttribute("aria-expanded", String(open));
  els.historyFilterMenu.hidden = !open;
}

function setHistoryFilter(value) {
  state.historyFilter = value;
  state.historyPage = 1;
  els.historyFilterLabel.textContent = HISTORY_FILTER_LABELS[value];
  els.historyFilterOptions.forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.value === value));
  });
  setHistoryFilterOpen(false);
  renderHistory();
}

function toggleHistoryFilter() {
  const open = els.historyFilterTrigger.getAttribute("aria-expanded") !== "true";
  setHistoryFilterOpen(open);
}

function handleHistoryFilterOption(event) {
  setHistoryFilter(event.currentTarget.dataset.value);
  els.historyFilterTrigger.focus();
}

function handleHistoryFilterKeydown(event) {
  if (event.key === "Escape") {
    setHistoryFilterOpen(false);
    els.historyFilterTrigger.focus();
    return;
  }

  if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
  event.preventDefault();
  const currentIndex = els.historyFilterOptions.indexOf(document.activeElement);
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = (currentIndex + direction + els.historyFilterOptions.length) % els.historyFilterOptions.length;
  els.historyFilterOptions[nextIndex].focus();
}

function closeHistoryFilterFromOutside(event) {
  if (!els.historyFilter.contains(event.target)) setHistoryFilterOpen(false);
}

async function loadData() {
  state.loadingDraw = true;
  renderLatestDraw();
  try {
    state.draws = await fetchLotteryHistory();
  } catch {
    state.draws = normalizeHistory(FALLBACK_DRAWS);
  } finally {
    state.loadingDraw = false;
  }

  try {
    state.draws = HistoryUtils.mergePrizeData(state.draws, await fetchPrizeHistory());
  } catch {
    // Fixed prize tiers still calculate locally; floating tiers stay explicitly unresolved.
  }

  state.latestDraw = state.draws[0];
  repairHistoryIssueMismatches();
  renderAll();
}

function bindEvents() {
  els.aiPickBtn.addEventListener("click", handleAiPick);
  els.betBtn.addEventListener("click", handleBet);
  els.deleteToggle.addEventListener("click", toggleDeleteMode);
  els.historyFilterTrigger.addEventListener("click", toggleHistoryFilter);
  els.historyFilterTrigger.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setHistoryFilterOpen(true);
    const selected = els.historyFilterOptions.find((option) => option.getAttribute("aria-selected") === "true");
    selected?.focus();
  });
  els.historyFilterOptions.forEach((option) => option.addEventListener("click", handleHistoryFilterOption));
  els.historyFilterMenu.addEventListener("keydown", handleHistoryFilterKeydown);
  document.addEventListener("click", closeHistoryFilterFromOutside);
}

bindEvents();
loadHistory();
renderAll();
loadData();
state.countdownTimer = setInterval(renderDateAndCountdown, 1000);
