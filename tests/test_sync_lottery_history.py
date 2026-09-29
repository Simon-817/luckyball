import unittest
from unittest.mock import patch

from scripts.sync_lottery_history import fetch_all_rows, merge_rows, normalize_official_rows, parse_8300_rows, sync_until_issue_available


class SyncLotteryHistoryTest(unittest.TestCase):
    def test_parses_8300_live_draw_row(self):
        page = """<tr><td>2026113期</td><td>2026-09-29</td><td>
            <span class="ball">01</span><span class="ball">04</span><span class="ball">11</span>
            <span class="ball">12</span><span class="ball">17</span><span class="ball">29</span>
            + <span class="blue">11</span></td><td>3.51亿</td></tr>"""
        self.assertEqual(parse_8300_rows(page), [{
            "issue": "2026113", "date": "2026-09-29",
            "red_balls": ["01", "04", "11", "12", "17", "29"],
            "blue_ball": "11", "prizegrades": [],
        }])

    def test_official_draw_wins_but_missing_metadata_is_preserved(self):
        third_party = {"issue": "2026113", "date": "2026-09-29",
                       "red_balls": ["01", "04", "11", "12", "17", "29"],
                       "blue_ball": "11", "prizegrades": []}
        official = {**third_party, "blue_ball": "12", "poolMoney": 320000000,
                    "prizegrades": [{"type": 1, "typemoney": 5000000}]}
        self.assertEqual(merge_rows([third_party], [official])[0], official)
        self.assertEqual(merge_rows([official], [third_party])[0], official | {"blue_ball": "11"})

    def test_official_failure_uses_live_html_and_recovery_overrides_it(self):
        live = {"issue": "2026113", "date": "2026-09-29",
                "red_balls": ["01", "04", "11", "12", "17", "29"],
                "blue_ball": "11", "prizegrades": []}
        official = {**live, "blue_ball": "12", "poolMoney": 320000000}
        with patch("scripts.sync_lottery_history.fetch_html_rows", return_value=[]), \
             patch("scripts.sync_lottery_history.fetch_live_html_rows", return_value=[live]), \
             patch("scripts.sync_lottery_history.fetch_official_rows", side_effect=RuntimeError("403")):
            self.assertEqual(fetch_all_rows(), [live])
        with patch("scripts.sync_lottery_history.fetch_html_rows", return_value=[]), \
             patch("scripts.sync_lottery_history.fetch_live_html_rows", return_value=[live]), \
             patch("scripts.sync_lottery_history.fetch_official_rows", return_value=[official]):
            self.assertEqual(fetch_all_rows(), [official])

    def test_normalizes_official_draw_rows(self):
        payload = {
            "result": [{
                "code": "2026077",
                "date": "2026-07-07(二)",
                "red": "01,04,05,14,18,25",
                "blue": "04",
                "poolmoney": "320076738",
                "prizegrades": [{"type": 1, "typenum": "6", "typemoney": "8516882"}],
            }]
        }

        self.assertEqual(normalize_official_rows(payload), [{
            "issue": "2026077",
            "date": "2026-07-07",
            "red_balls": ["01", "04", "05", "14", "18", "25"],
            "blue_ball": "04",
            "poolMoney": 320076738,
            "prizegrades": [{"type": 1, "typenum": "6", "typemoney": "8516882"}],
        }])

    def test_wait_loop_stops_when_expected_issue_is_available(self):
        calls = []

        def fetch_rows():
            calls.append(1)
            if len(calls) == 1:
                return [{
                    "issue": "2026076",
                    "date": "2026-07-06",
                    "red_balls": ["01", "02", "03", "04", "05", "06"],
                    "blue_ball": "07",
                }]
            return [{
                "issue": "2026077",
                "date": "2026-07-07",
                "red_balls": ["01", "04", "05", "14", "18", "25"],
                "blue_ball": "04",
            }]

        rows, found = sync_until_issue_available(
            fetch_rows,
            expected_issue="2026077",
            max_attempts=3,
            interval_seconds=0,
        )

        self.assertTrue(found)
        self.assertEqual(len(calls), 2)
        self.assertEqual(rows[0]["issue"], "2026077")

    def test_wait_loop_uses_minute_start_to_start_not_minute_after_fetch(self):
        stale = {"issue": "2026076", "date": "2026-07-05",
                 "red_balls": ["01", "02", "03", "04", "05", "06"], "blue_ball": "07"}
        current = {**stale, "issue": "2026077", "date": "2026-07-07"}
        with patch("scripts.sync_lottery_history.time.monotonic", side_effect=[100, 108, 160]), \
             patch("scripts.sync_lottery_history.time.sleep") as sleep:
            rows, found = sync_until_issue_available(
                iter(([stale], [current])).__next__, "2026077", max_attempts=2, interval_seconds=60,
            )
        self.assertTrue(found)
        self.assertEqual(rows[0]["issue"], "2026077")
        sleep.assert_called_once_with(52)


if __name__ == "__main__":
    unittest.main()
