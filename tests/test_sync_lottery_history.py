import unittest

from scripts.sync_lottery_history import normalize_official_rows, sync_until_issue_available


class SyncLotteryHistoryTest(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
