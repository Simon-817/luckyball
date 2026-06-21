(function exposeRestoredHistory(root) {
  const RESTORED_HISTORY_MARKER_KEY = "ssq-restored-history-20260621-v1";
  const RESTORED_HISTORY_RECORDS = [
    {
      id: "1782024000000-restored-2026070",
      issue: "2026070",
      betAt: "2026-06-21T12:00:00+08:00",
      lines: [
        { reds: [1, 22, 25, 27, 29, 32], blue: 15, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1781764800000-restored-2026069",
      issue: "2026069",
      betAt: "2026-06-18T12:00:00+08:00",
      lines: [
        { reds: [7, 10, 11, 14, 17, 21], blue: 3, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1781592000000-restored-2026068",
      issue: "2026068",
      betAt: "2026-06-16T12:00:00+08:00",
      lines: [
        { reds: [8, 9, 11, 15, 16, 19], blue: 13, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1781419200000-restored-2026067",
      issue: "2026067",
      betAt: "2026-06-14T12:00:00+08:00",
      lines: [
        { reds: [1, 15, 17, 18, 24, 27], blue: 3, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1781160000000-restored-2026066",
      issue: "2026066",
      betAt: "2026-06-11T12:00:00+08:00",
      lines: [
        { reds: [12, 17, 18, 21, 26, 27], blue: 12, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1780814400000-restored-2026064",
      issue: "2026064",
      betAt: "2026-06-07T12:00:00+08:00",
      lines: [
        { reds: [14, 16, 21, 27, 29, 33], blue: 4, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1780555200000-restored-2026063",
      issue: "2026063",
      betAt: "2026-06-04T12:00:00+08:00",
      lines: [
        { reds: [14, 16, 27, 29, 31, 33], blue: 6, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1780382400000-restored-2026062",
      issue: "2026062",
      betAt: "2026-06-02T12:00:00+08:00",
      lines: [
        { reds: [2, 14, 17, 18, 28, 29], blue: 14, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1780209600000-restored-2026061",
      issue: "2026061",
      betAt: "2026-05-31T12:00:00+08:00",
      lines: [
        { reds: [14, 16, 21, 25, 29, 31], blue: 3, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
    {
      id: "1779950400000-restored-2026060",
      issue: "2026060",
      betAt: "2026-05-28T12:00:00+08:00",
      lines: [
        { reds: [2, 6, 19, 21, 25, 27], blue: 8, type: "ai" },
        { reds: [5, 22, 24, 26, 29, 32], blue: 12, type: "fixed" },
        { reds: [6, 12, 17, 20, 28, 31], blue: 14, type: "fixed" },
      ],
    },
  ];

  const api = {
    RESTORED_HISTORY_MARKER_KEY,
    RESTORED_HISTORY_RECORDS,
  };

  root.RestoredHistory = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
