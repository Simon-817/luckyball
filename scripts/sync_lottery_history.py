#!/usr/bin/env python3
import argparse
import html
import json
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "lottery_history.json"
CHINA_TZ = timezone(timedelta(hours=8))
OFFICIAL_URL = (
    "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice"
    "?name=ssq&issueCount=&issueStart=&issueEnd=&dayStart=&dayEnd="
    "&pageNo=1&pageSize=100&week=&systemType=PC"
)
HTML_URL = "https://www.17500.cn/kj/list-ssq.html"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
    "Referer": "https://www.cwl.gov.cn/",
}


def fetch_text(url, timeout=20):
    request = Request(url, headers=HEADERS)
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def pad(value):
    return str(int(value)).zfill(2)


def normalize_issue(value):
    raw = re.sub(r"\D", "", str(value or ""))
    if len(raw) == 5:
        return f"20{raw}"
    return raw


def normalize_date(value):
    match = re.search(r"\d{4}[-/]\d{1,2}[-/]\d{1,2}", str(value or ""))
    if not match:
        return ""
    year, month, day = [int(part) for part in match.group(0).replace("/", "-").split("-")]
    return f"{year:04d}-{month:02d}-{day:02d}"


def normalize_reds(value):
    nums = [int(item) for item in re.findall(r"\d{1,2}", str(value or ""))]
    return [pad(num) for num in nums if 1 <= num <= 33][:6]


def number(value):
    digits = re.sub(r"\D", "", str(value or ""))
    return int(digits) if digits else 0


def normalize_prizegrades(rows):
    return rows if isinstance(rows, list) else []


def valid_row(row):
    return (
        row.get("issue")
        and row.get("date")
        and len(row.get("red_balls") or []) == 6
        and 1 <= int(row.get("blue_ball") or 0) <= 16
    )


def normalize_official_rows(payload):
    rows = payload.get("result") or payload.get("data") or []
    normalized = []
    for row in rows:
        item = {
            "issue": normalize_issue(row.get("code") or row.get("issue")),
            "date": normalize_date(row.get("date") or row.get("openTime")),
            "red_balls": normalize_reds(row.get("red") or row.get("frontWinningNum")),
            "blue_ball": pad(row.get("blue") or row.get("backWinningNum") or 0),
            "poolMoney": number(row.get("poolmoney") or row.get("poolMoney")),
            "prizegrades": normalize_prizegrades(row.get("prizegrades")),
        }
        if valid_row(item):
            normalized.append(item)
    return normalized


def parse_17500_rows(page):
    clean = html.unescape(page)
    rows = []
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", clean, flags=re.I | re.S):
        cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row, flags=re.I | re.S)
        if len(cells) < 3:
            continue
        issue = normalize_issue(re.search(r"\d{7}", cells[0]) and re.search(r"\d{7}", cells[0]).group(0))
        reds = [
            pad(match.group(1))
            for match in re.finditer(r"<b\b[^>]*class=[\"'][^\"']*\brbl\b[^\"']*[\"'][^>]*>(\d{1,2})</b>", cells[2], flags=re.I)
        ][:6]
        blue_match = re.search(r"<b\b[^>]*class=[\"'][^\"']*\bbbl\b[^\"']*[\"'][^>]*>(\d{1,2})</b>", cells[2], flags=re.I)
        item = {
            "issue": issue,
            "date": normalize_date(cells[1]),
            "red_balls": reds,
            "blue_ball": pad(blue_match.group(1)) if blue_match else "",
            "prizegrades": [],
        }
        if valid_row(item):
            rows.append(item)
    return rows


def fetch_official_rows():
    return normalize_official_rows(json.loads(fetch_text(OFFICIAL_URL)))


def fetch_html_rows():
    return parse_17500_rows(fetch_text(HTML_URL))


def load_existing():
    if not OUTPUT.exists():
        return []
    try:
        payload = json.loads(OUTPUT.read_text(encoding="utf-8"))
        return payload.get("data") or []
    except (OSError, ValueError):
        return []


def merge_rows(*row_sets):
    by_issue = {}
    for rows in row_sets:
        for row in rows:
            if valid_row(row):
                issue = str(row["issue"])
                by_issue[issue] = {**by_issue.get(issue, {}), **row}
    return sorted(by_issue.values(), key=lambda row: int(row["issue"]), reverse=True)


def china_now():
    return datetime.now(CHINA_TZ)


def is_draw_day(moment):
    return moment.weekday() in {1, 3, 6}


def draw_slots_after(latest_date, target):
    count = 0
    cursor = latest_date + timedelta(days=1)
    while cursor.date() <= target.date():
        draw_at = cursor.replace(hour=21, minute=15, second=0, microsecond=0)
        if is_draw_day(cursor) and draw_at <= target:
            count += 1
        cursor += timedelta(days=1)
    return count


def expected_issue_from_existing(existing_rows, now=None):
    if not existing_rows:
        return ""
    now = now or china_now()
    latest = sorted(existing_rows, key=lambda row: int(row["issue"]), reverse=True)[0]
    latest_date = datetime.fromisoformat(latest["date"]).replace(tzinfo=CHINA_TZ)
    increment = draw_slots_after(latest_date, now)
    return str(int(latest["issue"]) + increment) if increment else str(latest["issue"])


def fetch_all_rows():
    rows = []
    errors = []
    for fetcher in (fetch_official_rows, fetch_html_rows):
        try:
            rows.extend(fetcher())
        except Exception as error:
            errors.append(f"{fetcher.__name__}: {error}")
    if errors:
        print("Source warnings: " + "; ".join(errors))
    return rows


def sync_until_issue_available(fetch_rows, expected_issue, max_attempts=180, interval_seconds=60):
    rows = []
    for attempt in range(1, max_attempts + 1):
        rows = merge_rows(fetch_rows())
        found = any(str(row.get("issue")) == str(expected_issue) for row in rows)
        if found:
            return rows, True
        if attempt < max_attempts and interval_seconds:
            print(f"Expected issue {expected_issue} unavailable; retrying in {interval_seconds}s ({attempt}/{max_attempts})")
            time.sleep(interval_seconds)
    return rows, False


def write_payload(rows, source):
    payload = {
        "last_updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": source,
        "data": rows,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(rows)} draw records to {OUTPUT}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wait-for-current", action="store_true")
    parser.add_argument("--interval-seconds", type=int, default=60)
    parser.add_argument("--max-attempts", type=int, default=180)
    args = parser.parse_args()

    existing = load_existing()
    expected_issue = expected_issue_from_existing(existing)

    if args.wait_for_current and expected_issue:
        fetched, found = sync_until_issue_available(
            fetch_all_rows,
            expected_issue=expected_issue,
            max_attempts=args.max_attempts,
            interval_seconds=args.interval_seconds,
        )
        rows = merge_rows(existing, fetched)
        write_payload(rows, "中国福利彩票发行管理中心、17500.cn")
        if not found:
            raise RuntimeError(f"Expected issue {expected_issue} was not available")
        return

    rows = merge_rows(existing, fetch_all_rows())
    if not rows:
        raise RuntimeError("No lottery draw rows could be synchronized")
    write_payload(rows, "中国福利彩票发行管理中心、17500.cn")


if __name__ == "__main__":
    main()
