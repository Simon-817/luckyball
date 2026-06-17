import unittest

from scripts.sync_prizes import parse_detail_html


class ParseDetailHtmlTest(unittest.TestCase):
    def test_extracts_tier_count_and_single_ticket_amount(self):
        page = """
        <tr><td>一等奖</td><td>14注</td><td>中 6+1</td><td>5,649,404元</td></tr>
        <tr><td>二等奖</td><td>123注</td><td>中 6+0</td><td>295664元</td></tr>
        <tr><td>六等奖</td><td>123456注</td><td>中蓝球</td><td>5元</td></tr>
        """

        self.assertEqual(parse_detail_html(page), [
            {"type": 1, "typenum": 14, "typemoney": 5649404},
            {"type": 2, "typenum": 123, "typemoney": 295664},
            {"type": 6, "typenum": 123456, "typemoney": 5},
        ])


if __name__ == "__main__":
    unittest.main()
