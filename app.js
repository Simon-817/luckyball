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
const MAX_SHARED_REDS_PER_LINE = 2;
const MAX_RED_APPEARANCES_PER_PICK = 2;
const ANTI_BIRTHDAY_REDS = [32, 33];
const RED_BANDS = {
  small: [1, 11],
  middle: [12, 22],
  large: [23, 33],
};

const STRATEGY_LINE_PROFILES = [
  {
    id: "balanced",
    blueRange: [1, 5],
    bandCounts: { small: 2, middle: 2, large: 2 },
    requireAntiBirthday: true,
  },
  {
    id: "low-overlap",
    blueRange: [6, 11],
    excludeFirstLine: true,
    bandCounts: { small: 2, middle: [1, 2], large: [2, 3] },
    requireAntiBirthday: true,
  },
  {
    id: "coverage",
    fixedLine: { reds: [1, 14, 17, 18, 22, 26], blue: 1 },
  },
];

const ZONES = [
  { id: 1, range: [1, 6] },
  { id: 2, range: [7, 13] },
  { id: 3, range: [14, 20] },
  { id: 4, range: [21, 27] },
  { id: 5, range: [28, 33] },
];

const LUCKY_NUMS = new Set([6, 8, 9, 16, 18, 28, 33]);
const TENS_NUMS = new Set([10, 20, 30]);
const SYMMETRY_NUMS = new Set([3, 11, 12, 13, 21, 22, 23, 30, 31, 32, 33]);
const SOCIAL_NUMS = new Set([...LUCKY_NUMS, ...TENS_NUMS, ...SYMMETRY_NUMS]);

const HYBRID_CONFIG = {
  entropyFloor: 73,
  candidatePoolSize: 320,
  breakWeights: [
    [1, 0.26],
    [2, 0.5],
    [3, 0.24],
  ],
  skewPush: 1.38,
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
  heatProfile: null,
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

function randomFloat() {
  const cryptoSource = globalThis.crypto;
  if (cryptoSource?.getRandomValues) {
    const values = new Uint32Array(1);
    cryptoSource.getRandomValues(values);
    return values[0] / 4294967296;
  }
  return Math.random();
}

function randomInt(min, max) {
  return Math.floor(randomFloat() * (max - min + 1)) + min;
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

  return Math.max(1, count);
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
  const nextDraw = getNextDraw(timestamp);
  const latestIssue = Number(state.latestDraw?.issue || normalizeDraw(FALLBACK_DRAWS[0]).issue);
  const increment = nextDraw ? countDrawSlotsAfterLatest(nextDraw.timestamp) : 1;
  return String(latestIssue + increment);
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

function weightedPick(entries) {
  const valid = entries.filter((entry) => entry[1] > 0);
  const total = valid.reduce((sum, entry) => sum + entry[1], 0);
  let cursor = randomFloat() * total;

  for (const [value, weight] of valid) {
    cursor -= weight;
    if (cursor <= 0) return value;
  }

  return valid.at(-1)?.[0];
}

function weightedSample(items, count, weightFn) {
  const pool = [...items];
  const picked = [];

  while (picked.length < count && pool.length) {
    const entries = pool.map((item) => [item, Math.max(0, weightFn(item, picked))]);
    const next = weightedPick(entries);
    if (next === undefined) break;
    picked.push(next);
    pool.splice(pool.indexOf(next), 1);
  }

  return picked;
}

function zoneFor(num, zones = ZONES) {
  return zones.find((zone) => num >= zone.range[0] && num <= zone.range[1]);
}

function zoneNums(zone) {
  return range(zone.range[0], zone.range[1]);
}

function createDynamicZones() {
  const baseEnds = [6, 13, 20, 27];
  const ends = [];

  baseEnds.forEach((baseEnd, index) => {
    const previous = ends[index - 1] || 0;
    const remainingZones = 4 - index;
    const minEnd = previous + 5;
    const maxEnd = 33 - remainingZones * 5;
    const shifted = baseEnd + randomInt(-1, 1);
    ends.push(Math.max(minEnd, Math.min(maxEnd, shifted)));
  });

  const ranges = [];
  let start = 1;
  [...ends, 33].forEach((end, index) => {
    ranges.push({ id: index + 1, range: [start, end] });
    start = end + 1;
  });

  return ranges;
}

function isBirthday(num) {
  return num >= 1 && num <= 9;
}

function isSocialAnchor(num) {
  return isBirthday(num) || SOCIAL_NUMS.has(num);
}

function socialWeight(num) {
  let weight = 1;
  if (isBirthday(num)) weight *= 0.54;
  if (LUCKY_NUMS.has(num)) weight *= 0.68;
  if (TENS_NUMS.has(num)) weight *= 0.58;
  if (SYMMETRY_NUMS.has(num)) weight *= 0.64;
  return weight;
}

function relationToPrevious(num, previousReds) {
  if (previousReds.includes(num)) return "传号";
  if (previousReds.includes(num - 1) || previousReds.includes(num + 1)) return "邻号";
  return "";
}

function shadowScore(num, previousReds) {
  const relation = relationToPrevious(num, previousReds);
  if (relation === "邻号") return 1.45;
  if (relation === "传号") return 1.05;
  return 0;
}

function countInDraws(draws, num) {
  return draws.reduce((count, draw) => count + (draw.reds.includes(num) ? 1 : 0), 0);
}

function computeHeatProfile(draws) {
  const recent = draws.slice(0, HISTORY_WINDOW);
  const last10 = recent.slice(0, 10);
  const prev20 = recent.slice(10, 30);
  const latest5 = recent.slice(0, 5);
  const rows = range(RED_MIN, RED_MAX).map((num) => {
    const total = countInDraws(recent, num);
    const shortFreq = countInDraws(last10, num);
    const baseFreq = countInDraws(prev20, num);
    const latest5Freq = countInDraws(latest5, num);
    const lastSeen = recent.findIndex((draw) => draw.reds.includes(num));
    return { num, total, shortFreq, baseFreq, latest5Freq, lastSeen: lastSeen === -1 ? 99 : lastSeen };
  });

  const hotRows = [...rows]
    .sort((a, b) => b.total - a.total || b.shortFreq - a.shortFreq || a.lastSeen - b.lastSeen || a.num - b.num)
    .slice(0, 6);
  const hotNums = hotRows.map((row) => row.num);
  const hotSet = new Set(hotNums);
  const coldRows = [...rows]
    .filter((row) => !hotSet.has(row.num))
    .sort((a, b) => a.total - b.total || b.lastSeen - a.lastSeen || a.shortFreq - b.shortFreq || a.num - b.num)
    .slice(0, 6);
  const coldNums = coldRows.map((row) => row.num);
  const coldSet = new Set(coldNums);
  const freqMedian = [...rows].sort((a, b) => a.total - b.total)[Math.floor(rows.length / 2)].total;
  const warmingNums = [...rows]
    .filter((row) => !hotSet.has(row.num) && !coldSet.has(row.num))
    .map((row) => {
      const nearCold = coldSet.has(row.num - 1) || coldSet.has(row.num + 1);
      const trendLift = row.shortFreq - row.baseFreq / 2;
      const score =
        row.shortFreq * 2.8 +
        row.latest5Freq * 1.4 +
        (nearCold ? 1.1 : 0) +
        (row.total <= freqMedian ? 0.9 : 0) +
        trendLift -
        Math.max(0, row.total - freqMedian) * 0.35;
      return { ...row, score };
    })
    .sort((a, b) => b.score - a.score || a.total - b.total || a.num - b.num)
    .slice(0, 8)
    .map((row) => row.num);

  const heatRows = rows.map((row) => {
    const nearCold = coldSet.has(row.num - 1) || coldSet.has(row.num + 1);
    const nearHot = hotSet.has(row.num - 1) || hotSet.has(row.num + 1);
    const trendLift = row.shortFreq - row.baseFreq / 2;
    const missLift = Math.min(row.lastSeen, 12) / 12;
    const tempScore =
      row.shortFreq * 0.22 +
      row.latest5Freq * 0.28 +
      trendLift * 0.2 +
      missLift * 0.18 +
      (warmingNums.includes(row.num) ? 0.3 : 0) +
      (nearCold ? 0.12 : 0) -
      (hotSet.has(row.num) ? 0.45 : 0) -
      (coldSet.has(row.num) ? 0.38 : 0) -
      (nearHot ? 0.08 : 0);
    return { ...row, tempScore };
  });

  return { hotNums, coldNums, warmingNums, heatRows };
}

function readSettings() {
  const latest = state.latestDraw || normalizeDraw(FALLBACK_DRAWS[0]);
  const heatProfile = state.heatProfile || computeHeatProfile(normalizeHistory(FALLBACK_DRAWS));
  return {
    previousReds: latest.reds,
    hotNums: new Set(heatProfile.hotNums),
    coldNums: new Set(heatProfile.coldNums),
    warmingNums: new Set(heatProfile.warmingNums),
    heatRows: new Map((heatProfile.heatRows || []).map((row) => [row.num, row])),
  };
}

function tempLabel(num, settings) {
  if (settings.hotNums.has(num)) return "极热";
  if (settings.coldNums.has(num)) return "极冷";
  if (settings.warmingNums.has(num)) return "回温";
  if (settings.coldNums.has(num - 1) || settings.coldNums.has(num + 1)) return "冷邻";
  if (settings.hotNums.has(num - 1) || settings.hotNums.has(num + 1)) return "热邻";
  return "常温";
}

function tempWeight(num, settings) {
  const label = tempLabel(num, settings);
  const tempScore = settings.heatRows.get(num)?.tempScore || 0;
  const scoreBoost = Math.max(0.72, Math.min(1.38, 1 + tempScore * 0.22));
  if (label === "极热") return 0.36 * scoreBoost;
  if (label === "极冷") return 0.32 * scoreBoost;
  if (label === "回温") return 1.46 * scoreBoost;
  if (label === "冷邻") return 1.2 * scoreBoost;
  if (label === "热邻") return 0.84 * scoreBoost;
  return scoreBoost;
}

function chooseBrokenZones(settings, zones = ZONES) {
  const breakCount = weightedPick(HYBRID_CONFIG.breakWeights);
  const previousZoneIds = new Set(settings.previousReds.map((num) => zoneFor(num, zones).id));
  const entries = zones.map((zone) => {
    const hasPrevious = previousZoneIds.has(zone.id);
    const middleBias = zone.id === 3 ? 0.86 : 1;
    return [zone, (hasPrevious ? 0.82 : 1.14) * middleBias];
  });

  return new Set(
    weightedSample(
      entries.map(([zone]) => zone),
      breakCount,
      (zone) => entries.find(([candidate]) => candidate.id === zone.id)?.[1] || 1
    ).map((zone) => zone.id)
  );
}

function buildZoneBias(aliveZones) {
  const dominant = weightedPick(aliveZones.map((zone) => [zone.id, zone.id === 3 ? 1.1 : 1]));
  const secondary = weightedPick(aliveZones.filter((zone) => zone.id !== dominant).map((zone) => [zone.id, 1]));
  const bias = new Map();

  aliveZones.forEach((zone) => {
    let value = 0.86;
    if (zone.id === dominant) value = HYBRID_CONFIG.skewPush;
    if (zone.id === secondary) value = 1.1;
    bias.set(zone.id, value);
  });

  return bias;
}

function pickLockedShadows(settings, aliveNums, shadowTarget = null) {
  if (shadowTarget === null) {
    shadowTarget = weightedPick([
      [0, 0.05],
      [1, 0.7],
      [2, 0.25],
    ]);
  }
  if (!shadowTarget) return [];
  const viable = aliveNums.filter((num) => relationToPrevious(num, settings.previousReds) && tempWeight(num, settings) > 0);

  return weightedSample(viable, shadowTarget, (num) => {
    const warmingBoost = settings.warmingNums.has(num) ? 1.35 : 1;
    return shadowScore(num, settings.previousReds) * warmingBoost * socialWeight(num);
  });
}

function spacingPenalty(num, picked) {
  if (!picked.length) return 1;
  let penalty = 1;
  const tails = picked.filter((item) => item % 10 === num % 10).length;
  const near = picked.some((item) => Math.abs(item - num) === 1);
  const close = picked.some((item) => Math.abs(item - num) === 2);

  if (tails === 1) penalty *= 0.72;
  if (tails >= 2) penalty *= 0.12;
  if (near) penalty *= 0.55;
  if (close) penalty *= 0.82;
  return penalty;
}

function maxRunLength(nums) {
  let max = 1;
  let run = 1;
  for (let index = 1; index < nums.length; index += 1) {
    if (nums[index] === nums[index - 1] + 1) {
      run += 1;
      max = Math.max(max, run);
    } else {
      run = 1;
    }
  }
  return max;
}

function hasArithmeticRun(nums, length) {
  const set = new Set(nums);
  for (const start of nums) {
    for (let diff = 1; diff <= 10; diff += 1) {
      const chain = range(0, length - 1).map((step) => start + step * diff);
      if (chain.every((num) => set.has(num))) return true;
    }
  }
  return false;
}

function sameTailMax(nums) {
  const counts = new Map();
  nums.forEach((num) => counts.set(num % 10, (counts.get(num % 10) || 0) + 1));
  return Math.max(...counts.values());
}

function gapStats(nums) {
  const gaps = nums.slice(1).map((num, index) => num - nums[index]);
  const unique = new Set(gaps).size;
  const monotoneUp = gaps.every((gap, index) => index === 0 || gap >= gaps[index - 1]);
  const monotoneDown = gaps.every((gap, index) => index === 0 || gap <= gaps[index - 1]);
  return { gaps, unique, monotoneUp, monotoneDown };
}

function zoneDistribution(nums, zones = ZONES) {
  const counts = new Map(zones.map((zone) => [zone.id, 0]));
  nums.forEach((num) => counts.set(zoneFor(num, zones).id, counts.get(zoneFor(num, zones).id) + 1));
  return counts;
}

function countPairs(nums, predicate) {
  let count = 0;
  for (let i = 0; i < nums.length; i += 1) {
    for (let j = i + 1; j < nums.length; j += 1) {
      if (predicate(nums[i], nums[j])) count += 1;
    }
  }
  return count;
}

function countInRange(nums, rangeBounds) {
  const [min, max] = rangeBounds;
  return nums.filter((num) => num >= min && num <= max).length;
}

function numsInBand(bandName) {
  return range(RED_BANDS[bandName][0], RED_BANDS[bandName][1]);
}

function resolveBandCounts(profile) {
  if (!profile.bandCounts) return null;

  const counts = {};
  Object.entries(profile.bandCounts).forEach(([bandName, value]) => {
    counts[bandName] = Array.isArray(value) ? randomInt(value[0], value[1]) : value;
  });

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total === 6) return counts;

  if (counts.large !== undefined) counts.large += 6 - total;
  return counts;
}

function lineRedCounts(lines) {
  return redAppearanceMap(lines);
}

function canUseRed(num, selectedLines, excluded = new Set()) {
  const appearances = lineRedCounts(selectedLines).get(num) || 0;
  return !excluded.has(num) && appearances < MAX_RED_APPEARANCES_PER_PICK;
}

function chooseAntiBirthdayRed(settings, selectedLines, excluded = new Set()) {
  const pool = ANTI_BIRTHDAY_REDS.filter((num) => canUseRed(num, selectedLines, excluded));
  if (!pool.length) return null;
  return weightedSample(pool, 1, (num) => socialWeight(num) * tempWeight(num, settings))[0] || null;
}

function structuredWeight(num, settings, picked, selectedLines, profile) {
  const usedBefore = selectedLines.some((line) => line.reds.includes(num));
  const reusePenalty = profile.preferUnusedReds && usedBefore ? 0.08 : 1;
  return socialWeight(num) * tempWeight(num, settings) * spacingPenalty(num, picked) * reusePenalty;
}

function pickStructuredReds(pool, count, settings, picked, selectedLines, profile) {
  const available = pool.filter((num) => !picked.includes(num) && canUseRed(num, selectedLines));
  return weightedSample(available, count, (num, localPicked) => {
    return structuredWeight(num, settings, [...picked, ...localPicked], selectedLines, profile);
  });
}

function hasTailLadder(nums) {
  const tailGroups = new Map();
  nums.forEach((num) => {
    const tail = num % 10;
    tailGroups.set(tail, [...(tailGroups.get(tail) || []), num]);
  });

  return [...tailGroups.values()].some((items) => {
    if (items.length < 3) return false;
    const sorted = [...items].sort((a, b) => a - b);
    return hasArithmeticRun(sorted, 3);
  });
}

function analyzeReds(reds, settings, brokenZones, zones = ZONES, relaxed = false) {
  const birthdayCount = reds.filter(isBirthday).length;
  const socialCount = reds.filter(isSocialAnchor).length;
  const tensCount = reds.filter((num) => TENS_NUMS.has(num)).length;
  const symmetryCount = reds.filter((num) => SYMMETRY_NUMS.has(num)).length;
  const evenCount = reds.filter((num) => num % 2 === 0).length;
  const highCount = reds.filter((num) => num >= 17).length;
  const lowHumanCount = reds.filter((num) => num <= 31).length;
  const evenNodeCount = reds.filter((num) => num % 2 === 0 && num <= 18).length;
  const fiveMultipleCount = reds.filter((num) => num % 5 === 0).length;
  const sum = reds.reduce((total, num) => total + num, 0);
  const runs = maxRunLength(reds);
  const arithmetic4 = hasArithmeticRun(reds, 4);
  const arithmetic3 = hasArithmeticRun(reds, 3);
  const tailLadder = hasTailLadder(reds);
  const tailMax = sameTailMax(reds);
  const gaps = gapStats(reds);
  const zoneCounts = [...zoneDistribution(reds, zones).values()].filter(Boolean);
  const occupiedZones = zoneCounts.length;
  const maxZone = Math.max(...zoneCounts);
  const mirrorPairs = countPairs(reds, (a, b) => a + b === 34);
  const shadowItems = reds
    .map((num) => ({ num, relation: relationToPrevious(num, settings.previousReds) }))
    .filter((item) => item.relation);
  const warmingCount = reds.filter((num) => tempLabel(num, settings) === "回温").length;
  const coolNeighborCount = reds.filter((num) => tempLabel(num, settings) === "冷邻").length;
  const extremeTempCount = reds.filter((num) => ["极热", "极冷"].includes(tempLabel(num, settings))).length;

  let entropyScore = 100;
  entropyScore -= birthdayCount * 3;
  entropyScore -= Math.max(0, socialCount - 2) * 5;
  entropyScore -= Math.max(0, tailMax - 1) * 6;
  entropyScore -= mirrorPairs * 7;
  entropyScore -= arithmetic3 ? 8 : 0;
  entropyScore -= gaps.unique <= 2 ? 15 : 0;
  entropyScore -= gaps.monotoneUp || gaps.monotoneDown ? 8 : 0;
  entropyScore -= evenCount === 3 ? 10 : 0;
  entropyScore -= highCount === 3 ? 8 : 0;
  entropyScore -= maxZone >= 4 ? 8 : 0;
  entropyScore -= occupiedZones === 5 ? 10 : 0;
  entropyScore -= Math.abs(sum - 102) <= 6 ? 7 : 0;
  entropyScore -= lowHumanCount === 6 ? 5 : 0;
  entropyScore -= Math.max(0, evenNodeCount - 3) * 4;
  entropyScore -= Math.max(0, fiveMultipleCount - 1) * 6;
  entropyScore -= tailLadder ? 10 : 0;
  entropyScore -= sum >= 92 && sum <= 112 ? 4 : 0;
  entropyScore -= shadowItems.length === 0 || shadowItems.length > 2 ? 15 : 0;
  entropyScore -= extremeTempCount * 8;
  entropyScore = Math.max(0, Math.round(entropyScore));

  const hardValid =
    runs < 3 &&
    !arithmetic4 &&
    !tailLadder &&
    tailMax < 3 &&
    mirrorPairs <= 1 &&
    shadowItems.length <= 2 &&
    maxZone <= 3;
  const strictValid =
    birthdayCount <= 2 &&
      socialCount <= 3 &&
      tensCount <= 1 &&
      symmetryCount <= 2 &&
      [2, 4].includes(evenCount) &&
      [2, 4].includes(highCount) &&
      lowHumanCount <= 5 &&
      evenNodeCount <= 4 &&
      fiveMultipleCount <= 2 &&
      warmingCount + coolNeighborCount >= 1 &&
      extremeTempCount <= 2 &&
      entropyScore >= HYBRID_CONFIG.entropyFloor;
  const relaxedValid = entropyScore >= 58 && socialCount <= 4 && extremeTempCount <= 3;
  const valid = hardValid && (relaxed ? relaxedValid : strictValid);

  return {
    valid,
    entropyScore,
    brokenZones,
    birthdayCount,
    socialCount,
    tensCount,
    symmetryCount,
    evenCount,
    highCount,
    sum,
    tailMax,
    occupiedZones,
    maxZone,
    shadowCount: shadowItems.length,
    warmingCount,
    coolNeighborCount,
    extremeTempCount,
  };
}

function scoreCandidate(reds, analysis, zones) {
  const zoneWidthSpread = Math.max(...zones.map((zone) => zone.range[1] - zone.range[0] + 1)) -
    Math.min(...zones.map((zone) => zone.range[1] - zone.range[0] + 1));
  let score = analysis.entropyScore;

  score += analysis.shadowCount === 1 ? 9 : analysis.shadowCount === 2 ? 6 : 1;
  score += Math.min(analysis.warmingCount + analysis.coolNeighborCount, 3) * 4;
  score += analysis.occupiedZones <= 3 ? 8 : 0;
  score += analysis.maxZone === 2 ? 5 : analysis.maxZone === 3 ? 2 : 0;
  score += Math.abs(analysis.sum - 102) > 14 ? 6 : 0;
  score -= Math.max(0, analysis.socialCount - 2) * 4;
  score -= analysis.extremeTempCount * 5;
  score -= zoneWidthSpread > 2 ? 4 : 0;
  score -= sameTailMax(reds) > 2 ? 12 : 0;

  return Math.round(score);
}

function buildCandidateLine(settings, relaxed = false, targetShadowCount = null) {
  const zones = createDynamicZones();
  const brokenZones = chooseBrokenZones(settings, zones);
  const aliveZones = zones.filter((zone) => !brokenZones.has(zone.id));
  const aliveNums = aliveZones.flatMap(zoneNums);
  const zoneBias = buildZoneBias(aliveZones);
  const locked = pickLockedShadows(settings, aliveNums, targetShadowCount);

  if (locked.length > 2) return null;

  const picked = [...locked];
  const candidates = aliveNums.filter((num) => !picked.includes(num));

  while (picked.length < 6) {
    const next = weightedSample(candidates.filter((num) => !picked.includes(num)), 1, (num) => {
      const zone = zoneFor(num, zones);
      const selectedInZone = picked.filter((item) => zoneFor(item, zones).id === zone.id).length;
      const zoneCrowdPenalty = selectedInZone >= 3 ? 0.22 : selectedInZone === 2 ? 0.62 : 1;
      const hasShadowRelation = relationToPrevious(num, settings.previousReds);
      const shadowLeakPenalty = hasShadowRelation ? (targetShadowCount === 0 ? 0.06 : 0.44) : 1;

      return (
        zoneBias.get(zone.id) *
        socialWeight(num) *
        tempWeight(num, settings) *
        spacingPenalty(num, picked) *
        zoneCrowdPenalty *
        shadowLeakPenalty
      );
    })[0];

    if (!next) break;
    picked.push(next);
  }

  if (picked.length !== 6) return null;
  const reds = [...picked].sort((a, b) => a - b);
  const analysis = analyzeReds(reds, settings, brokenZones, zones, relaxed);
  if (!analysis.valid) return null;
  if (targetShadowCount !== null && analysis.shadowCount !== targetShadowCount) return null;

  return {
    reds,
    blue: randomBlue(),
    type: "ai",
    entropyScore: analysis.entropyScore,
    strategyScore: scoreCandidate(reds, analysis, zones),
    meta: {
      brokenZones: [...brokenZones],
      zones: zones.map((zone) => zone.range),
      shadowCount: analysis.shadowCount,
      warmingCount: analysis.warmingCount,
      coolNeighborCount: analysis.coolNeighborCount,
    },
  };
}

function chooseTopCandidate(candidates, targetShadowCount = null) {
  const scoped = targetShadowCount === null
    ? candidates
    : candidates.filter((item) => item.meta?.shadowCount === targetShadowCount);
  const pool = scoped.length ? scoped : candidates;
  const sorted = [...pool].sort((a, b) => b.strategyScore - a.strategyScore || b.entropyScore - a.entropyScore);
  const top = sorted.slice(0, Math.min(12, sorted.length));
  return weightedPick(top.map((item, index) => [item, Math.max(1, top.length - index)]));
}

function chooseTargetShadowCount() {
  return weightedPick([
    [0, 0.05],
    [1, 0.7],
    [2, 0.25],
  ]);
}

function collectCandidateLines(settings, targetShadowCount = null) {
  const candidates = [];

  for (let attempt = 0; attempt < HYBRID_CONFIG.candidatePoolSize; attempt += 1) {
    const candidate = buildCandidateLine(settings, false, targetShadowCount);
    if (candidate) candidates.push(candidate);
  }

  if (!candidates.length) {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const candidate = buildCandidateLine(settings);
      if (candidate) candidates.push(candidate);
    }
  }

  if (!candidates.length) {
    for (let attempt = 0; attempt < 140; attempt += 1) {
      const candidate = buildCandidateLine(settings, true, targetShadowCount);
      if (candidate) candidates.push(candidate);
    }
  }

  if (candidates.length) return chooseTopCandidate(candidates, targetShadowCount);

  for (let attempt = 0; attempt < 140; attempt += 1) {
    const candidate = buildCandidateLine(settings, true);
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

function buildFallbackLine(settings) {
  const fallbackReds = weightedSample(range(RED_MIN, RED_MAX), 6, (num, picked) => {
    return socialWeight(num) * spacingPenalty(num, picked) * tempWeight(num, settings);
  }).sort((a, b) => a - b);
  const fallbackAnalysis = analyzeReds(fallbackReds, settings, new Set(), ZONES, true);
  return {
    reds: fallbackReds,
    blue: randomBlue(),
    type: "ai",
    entropyScore: fallbackAnalysis.entropyScore,
    strategyScore: scoreCandidate(fallbackReds, fallbackAnalysis, ZONES),
  };
}

function excludedRedsForProfile(profile, selectedLines) {
  if (profile.excludeFirstLine && selectedLines[0]) return new Set(selectedLines[0].reds);
  return new Set();
}

function buildBandStructuredReds(settings, profile, selectedLines) {
  const counts = resolveBandCounts(profile);
  const excluded = excludedRedsForProfile(profile, selectedLines);
  const picked = [];

  if (profile.requireAntiBirthday) {
    const anchor = chooseAntiBirthdayRed(settings, selectedLines, excluded);
    if (!anchor) return null;
    picked.push(anchor);
  }

  Object.entries(counts).forEach(([bandName, targetCount]) => {
    const currentCount = countInRange(picked, RED_BANDS[bandName]);
    const needed = Math.max(0, targetCount - currentCount);
    if (!needed) return;

    const pool = numsInBand(bandName).filter((num) => !excluded.has(num));
    picked.push(...pickStructuredReds(pool, needed, settings, picked, selectedLines, profile));
  });

  if (picked.length !== 6) return null;
  return [...picked].sort((a, b) => a - b);
}

function buildCoverageStructuredReds(settings, profile, selectedLines) {
  const used = new Set(selectedLines.flatMap((line) => line.reds));
  const picked = [];

  if (profile.requireAntiBirthday) {
    const anchor = chooseAntiBirthdayRed(settings, selectedLines);
    if (!anchor) return null;
    picked.push(anchor);
  }

  const preferredPool = range(RED_MIN, RED_MAX).filter((num) => !used.has(num));
  picked.push(...pickStructuredReds(preferredPool, 6 - picked.length, settings, picked, selectedLines, profile));

  if (picked.length < 6) {
    picked.push(...pickStructuredReds(range(RED_MIN, RED_MAX), 6 - picked.length, settings, picked, selectedLines, profile));
  }

  if (picked.length !== 6) return null;
  return [...picked].sort((a, b) => a - b);
}

function buildFixedStrategyLine(profile) {
  return {
    reds: [...profile.fixedLine.reds].sort((a, b) => a - b),
    blue: profile.fixedLine.blue,
    type: "fixed",
    entropyScore: 0,
    strategyScore: 0,
    meta: { profile: profile.id },
  };
}

function futureFixedStrategyLines(currentIndex) {
  return STRATEGY_LINE_PROFILES
    .slice(currentIndex + 1)
    .filter((profile) => profile.fixedLine)
    .map(buildFixedStrategyLine);
}

function isStructuredRedsValid(reds, profile, selectedLines) {
  if (!reds || new Set(reds).size !== 6) return false;
  if (maxRunLength(reds) >= 3) return false;
  if (hasArithmeticRun(reds, 4)) return false;
  if (hasTailLadder(reds)) return false;
  if (profile.requireAntiBirthday && countInRange(reds, [32, 33]) !== 1) return false;
  if (profile.requireAtLeastThirty && !reds.some((num) => num >= 30)) return false;
  if (profile.parityOddCounts && !profile.parityOddCounts.includes(reds.filter((num) => num % 2 === 1).length)) {
    return false;
  }
  if (profile.excludeFirstLine && selectedLines[0]?.reds.some((num) => reds.includes(num))) return false;

  if (profile.bandCounts) {
    const bandCountsOk = Object.entries(profile.bandCounts).every(([bandName, value]) => {
      const expected = Array.isArray(value) ? value : [value, value];
      const actual = countInRange(reds, RED_BANDS[bandName]);
      return actual >= expected[0] && actual <= expected[1];
    });
    if (!bandCountsOk) return false;
  }

  return isDiverseCandidate({ reds }, selectedLines);
}

function buildStructuredCandidate(settings, profile, selectedLines) {
  const reds = profile.bandCounts
    ? buildBandStructuredReds(settings, profile, selectedLines)
    : buildCoverageStructuredReds(settings, profile, selectedLines);

  if (!isStructuredRedsValid(reds, profile, selectedLines)) return null;

  const relaxedAnalysis = analyzeReds(reds, settings, new Set(), ZONES, true);
  return {
    reds,
    blue: randomBlue(profile.blueRange, new Set(selectedLines.map((line) => line.blue))),
    type: "ai",
    entropyScore: relaxedAnalysis.entropyScore,
    strategyScore: scoreCandidate(reds, relaxedAnalysis, ZONES),
    meta: {
      profile: profile.id,
      shadowCount: relaxedAnalysis.shadowCount,
      warmingCount: relaxedAnalysis.warmingCount,
      coolNeighborCount: relaxedAnalysis.coolNeighborCount,
    },
  };
}

function buildStructuredLine(settings, profile, selectedLines) {
  const candidates = [];

  for (let attempt = 0; attempt < HYBRID_CONFIG.candidatePoolSize * 3; attempt += 1) {
    const candidate = buildStructuredCandidate(settings, profile, selectedLines);
    if (candidate) candidates.push(candidate);
  }

  if (!candidates.length) return null;
  return chooseDiverseCandidate(candidates, selectedLines);
}

function redOverlapCount(left, right) {
  const rightSet = new Set(right);
  return left.filter((num) => rightSet.has(num)).length;
}

function redAppearanceMap(lines) {
  const counts = new Map();
  lines.forEach((line) => {
    line.reds.forEach((num) => counts.set(num, (counts.get(num) || 0) + 1));
  });
  return counts;
}

function zoneSignature(reds, zones = ZONES) {
  return [...zoneDistribution(reds, zones).values()].join("-");
}

function isDiverseCandidate(candidate, selectedLines) {
  const pairOverlapsOk = selectedLines.every((line) => (
    redOverlapCount(candidate.reds, line.reds) <= MAX_SHARED_REDS_PER_LINE
  ));
  const redAppearancesOk = [...redAppearanceMap([...selectedLines, candidate]).values()]
    .every((count) => count <= MAX_RED_APPEARANCES_PER_PICK);

  return pairOverlapsOk && redAppearancesOk;
}

function lineDiversityPenalty(candidate, selectedLines) {
  if (!selectedLines.length) return 0;

  const redCounts = redAppearanceMap(selectedLines);
  const repeatedReds = candidate.reds.filter((num) => redCounts.has(num)).length;
  const overusedReds = candidate.reds.filter((num) => (redCounts.get(num) || 0) >= MAX_RED_APPEARANCES_PER_PICK).length;
  const maxOverlap = Math.max(...selectedLines.map((line) => redOverlapCount(candidate.reds, line.reds)));
  const sameZoneSignature = selectedLines.filter((line) => zoneSignature(line.reds) === zoneSignature(candidate.reds)).length;

  return repeatedReds * 5 + overusedReds * 28 + Math.max(0, maxOverlap - 1) * 12 + sameZoneSignature * 18;
}

function chooseDiverseCandidate(candidates, selectedLines, targetShadowCount = null) {
  const scoped = targetShadowCount === null
    ? candidates
    : candidates.filter((item) => item.meta?.shadowCount === targetShadowCount);
  const targetPool = scoped.length ? scoped : candidates;
  const diversePool = targetPool.filter((candidate) => isDiverseCandidate(candidate, selectedLines));
  const pool = diversePool.length ? diversePool : targetPool;
  const sorted = [...pool].sort((a, b) => {
    const aScore = a.strategyScore + a.entropyScore * 0.1 - lineDiversityPenalty(a, selectedLines);
    const bScore = b.strategyScore + b.entropyScore * 0.1 - lineDiversityPenalty(b, selectedLines);
    return bScore - aScore || b.strategyScore - a.strategyScore || b.entropyScore - a.entropyScore;
  });
  const top = sorted.slice(0, Math.min(12, sorted.length));
  return weightedPick(top.map((item, index) => [item, Math.max(1, top.length - index)]));
}

function chooseGroupLine(settings, selectedLines, targetShadowCount = chooseTargetShadowCount()) {
  const profile = STRATEGY_LINE_PROFILES[selectedLines.length];
  if (profile) {
    if (profile.fixedLine) return buildFixedStrategyLine(profile);

    const strategyContextLines = [...selectedLines, ...futureFixedStrategyLines(selectedLines.length)];
    const structuredLine = buildStructuredLine(settings, profile, strategyContextLines);
    if (structuredLine) return structuredLine;

    const allCandidates = [];
    const targetAttempts = [targetShadowCount, null, chooseTargetShadowCount(), null, chooseTargetShadowCount()];

    for (const target of targetAttempts) {
      const candidates = collectCandidateLines(settings, target);
      allCandidates.push(...candidates);
      const diverseCandidates = candidates.filter((candidate) => isDiverseCandidate(candidate, strategyContextLines));
      if (diverseCandidates.length) return chooseDiverseCandidate(diverseCandidates, strategyContextLines, target);
    }

    const diverseCandidates = allCandidates.filter((candidate) => isDiverseCandidate(candidate, strategyContextLines));
    if (diverseCandidates.length) return chooseDiverseCandidate(diverseCandidates, strategyContextLines);
    if (allCandidates.length) return chooseDiverseCandidate(allCandidates, strategyContextLines);
    return buildFallbackLine(settings);
  }

  const allCandidates = [];
  const targetAttempts = [targetShadowCount, null, chooseTargetShadowCount(), null, chooseTargetShadowCount()];

  for (const target of targetAttempts) {
    const candidates = collectCandidateLines(settings, target);
    allCandidates.push(...candidates);
    const diverseCandidates = candidates.filter((candidate) => isDiverseCandidate(candidate, selectedLines));
    if (diverseCandidates.length) return chooseDiverseCandidate(diverseCandidates, selectedLines, target);
  }

  const diverseCandidates = allCandidates.filter((candidate) => isDiverseCandidate(candidate, selectedLines));
  if (diverseCandidates.length) return chooseDiverseCandidate(diverseCandidates, selectedLines);
  if (allCandidates.length) return chooseDiverseCandidate(allCandidates, selectedLines);
  return buildFallbackLine(settings);
}

function generateAiLine() {
  const settings = readSettings();
  const targetShadowCount = chooseTargetShadowCount();
  const candidates = collectCandidateLines(settings, targetShadowCount);

  if (candidates.length) return chooseTopCandidate(candidates, targetShadowCount);
  return buildFallbackLine(settings);
}

function generateAiLines(count = CURRENT_PICK_COUNT) {
  const settings = readSettings();
  const lines = [];

  while (lines.length < count) {
    lines.push(chooseGroupLine(settings, lines));
  }

  return lines;
}

function randomBlue(bounds = [BLUE_MIN, BLUE_MAX], excluded = new Set()) {
  const pool = range(bounds[0], bounds[1]).filter((num) => !excluded.has(num));
  const candidates = pool.length ? pool : range(bounds[0], bounds[1]);
  return candidates[randomInt(0, candidates.length - 1)];
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
  els.betBtn.disabled = false;
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

function handleAiPick() {
  const lines = generateAiLines();
  state.generatedLine = lines[0];
  state.currentLines = lines;
  renderGenerator();
  renderCurrentBet();
}

function handleBet() {
  if (!state.currentLines.length) return;
  const now = Date.now();
  const record = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    issue: getBetIssue(now),
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
  state.heatProfile = computeHeatProfile(state.draws);
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
