(function exposeHistoryUtils(root) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const RANGE_DAYS = {
    "30d": 30,
    "6m": 183,
    "1y": 365,
  };

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

  const api = { filterHistory, paginateHistory, matchedNumbers, recordTimestamp };
  root.HistoryUtils = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
