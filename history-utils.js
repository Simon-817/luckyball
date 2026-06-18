(function exposeHistoryUtils(root) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const RANGE_DAYS = {
    "30d": 30,
    "6m": 183,
    "1y": 365,
  };
  const FIXED_PRIZE_AMOUNTS = {
    三等奖: 3000,
    四等奖: 200,
    五等奖: 10,
    六等奖: 5,
    福运奖: 5,
  };
  const PRIZE_NAMES = {
    1: "一等奖",
    2: "二等奖",
    3: "三等奖",
    4: "四等奖",
    5: "五等奖",
    6: "六等奖",
    7: "福运奖",
  };

  function toNumber(value) {
    return Number(String(value).replace(/\D/g, ""));
  }

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function normalizePrizeRows(rows) {
    if (!Array.isArray(rows)) return {};
    return rows.reduce((prizes, row) => {
      const name = row?.name || PRIZE_NAMES[Number(row?.type)];
      const amount = Number(String(row?.typemoney ?? row?.amount ?? "").replace(/,/g, ""));
      if (name && Number.isFinite(amount) && amount > 0) prizes[name] = amount;
      return prizes;
    }, {});
  }

  function normalizeDate(dateText) {
    const match = String(dateText || "").match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
    if (!match) return "";
    const [year, month, day] = match[0].replace(/\//g, "-").split("-").map(Number);
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function parseHtmlDrawsWithDom(html) {
    if (typeof DOMParser === "undefined") return [];
    const document = new DOMParser().parseFromString(String(html || ""), "text/html");
    return [...document.querySelectorAll("tr")]
      .map((row) => {
        const cells = [...row.querySelectorAll("td")];
        if (cells.length < 3) return null;
        const issue = String(cells[0].textContent || "").match(/\d{7}/)?.[0] || "";
        const date = normalizeDate(cells[1].textContent);
        const reds = [...cells[2].querySelectorAll(".rbl, .rb")]
          .map((ball) => toNumber(ball.textContent))
          .filter((num) => num >= 1 && num <= 33)
          .slice(0, 6);
        const blue = toNumber(cells[2].querySelector(".bbl, .bb")?.textContent || "");
        return issue && date && reds.length === 6 && blue >= 1 && blue <= 16
          ? { issue, date, reds, blue, prizes: {} }
          : null;
      })
      .filter(Boolean);
  }

  function parseHtmlDrawsWithRegex(html) {
    return String(html || "")
      .match(/<tr[\s\S]*?<\/tr>/gi)
      ?.map((row) => {
        const cells = row.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (cells.length < 3) return null;
        const issue = cells[0].match(/\d{7}/)?.[0] || "";
        const date = normalizeDate(cells[1]);
        const reds = [...cells[2].matchAll(/<b\b[^>]*class=["'][^"']*\brbl\b[^"']*["'][^>]*>(\d{1,2})<\/b>/gi)]
          .map((match) => toNumber(match[1]))
          .filter((num) => num >= 1 && num <= 33)
          .slice(0, 6);
        const blue = toNumber(cells[2].match(/<b\b[^>]*class=["'][^"']*\bbbl\b[^"']*["'][^>]*>(\d{1,2})<\/b>/i)?.[1] || "");
        return issue && date && reds.length === 6 && blue >= 1 && blue <= 16
          ? { issue, date, reds, blue, prizes: {} }
          : null;
      })
      .filter(Boolean) || [];
  }

  function parseHtmlDraws(html) {
    const domDraws = parseHtmlDrawsWithDom(html);
    return domDraws.length ? domDraws : parseHtmlDrawsWithRegex(html);
  }

  function mergePrizeData(draws, rows) {
    const byIssue = new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row.issue), row]));
    return draws.map((draw) => {
      const row = byIssue.get(String(draw.issue));
      const synced = normalizePrizeRows(row?.prizes || row?.prizegrades);
      return { ...draw, prizes: { ...(draw.prizes || {}), ...synced } };
    });
  }

  function recordTimestamp(record) {
    const betAt = Date.parse(record?.betAt || "");
    if (Number.isFinite(betAt)) return betAt;

    const idTimestamp = Number(String(record?.id || "").split("-")[0]);
    return Number.isFinite(idTimestamp) && idTimestamp > 0 ? idTimestamp : 0;
  }

  function filterHistory(records, range, now = Date.now()) {
    if (range === "all") return [...records];
    const days = RANGE_DAYS[range] || RANGE_DAYS["30d"];
    const earliest = now - days * DAY_MS;
    return records.filter((record) => {
      const timestamp = recordTimestamp(record);
      return timestamp >= earliest && timestamp <= now;
    });
  }

  function paginateHistory(records, page, pageSize = 12) {
    return records.slice(0, Math.max(1, page) * pageSize);
  }

  function matchedNumbers(line, draw) {
    if (!draw) return { reds: [], blue: false };
    return {
      reds: line.reds.filter((number) => draw.reds.includes(number)),
      blue: line.blue === draw.blue,
    };
  }

  function evaluateLine(line, draw) {
    if (!draw) return "未开奖";
    const redHits = line.reds.filter((number) => draw.reds.includes(number)).length;
    const blueHit = line.blue === draw.blue;

    if (redHits === 6 && blueHit) return "一等奖";
    if (redHits === 6) return "二等奖";
    if (redHits === 5 && blueHit) return "三等奖";
    if (redHits === 5 || (redHits === 4 && blueHit)) return "四等奖";
    if (redHits === 4 || (redHits === 3 && blueHit)) return "五等奖";
    if (blueHit && redHits <= 2) return "六等奖";
    if (redHits === 3 && !blueHit) return "福运奖";
    return "未中奖";
  }

  function prizeAmount(status, draw) {
    const syncedAmount = Number(draw?.prizes?.[status]);
    if (Number.isFinite(syncedAmount) && syncedAmount > 0) return syncedAmount;
    return FIXED_PRIZE_AMOUNTS[status] ?? null;
  }

  function calculateWinningStats(records, draws, range, now = Date.now()) {
    const drawByIssue = new Map(draws.map((draw) => [String(draw.issue), draw]));
    const filtered = filterHistory(records, range, now);
    let winCount = 0;
    let totalAmount = 0;
    let unresolvedAmountCount = 0;

    filtered.forEach((record) => {
      const draw = drawByIssue.get(String(record.issue));
      if (!draw) return;

      record.lines.forEach((line) => {
        const status = evaluateLine(line, draw);
        if (status === "未开奖" || status === "未中奖") return;
        winCount += 1;
        const amount = prizeAmount(status, draw);
        if (amount === null) {
          unresolvedAmountCount += 1;
        } else {
          totalAmount += amount;
        }
      });
    });

    return { winCount, totalAmount, unresolvedAmountCount };
  }

  const api = {
    calculateWinningStats,
    evaluateLine,
    filterHistory,
    matchedNumbers,
    mergePrizeData,
    normalizePrizeRows,
    parseHtmlDraws,
    paginateHistory,
    prizeAmount,
    recordTimestamp,
  };
  root.HistoryUtils = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
