#!/usr/bin/env python3
import html
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "lottery_prizes.json"
OFFICIAL_URL = (
    "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice"
    "?name=ssq&issueCount=&issueStart=&issueEnd=&dayStart=&dayEnd="
    "&pageNo=1&pageSize=100&week=&systemType=PC"
)
FALLBACK_LIST_URL = "https://www.8300.cn/kjhhis/6/100.html"
FALLBACK_DETAIL_URL = "https://www.8300.cn/kjh/6/{issue}.html"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
    "Referer": "https://www.cwl.gov.cn/",
}
PRIZE_TYPES = {
    "一等奖": 1,
    "二等奖": 2,
    "三等奖": 3,
    "四等奖": 4,
    "五等奖": 5,
    "六等奖": 6,
    "福运奖": 7,
}


def fetch_text(url, timeout=15):
    request = Request(url, headers=HEADERS)
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def number(value):
    digits = re.sub(r"[^0-9]", "", str(value or ""))
    return int(digits) if digits else 0


def parse_detail_html(page):
    clean = html.unescape(page)
    rows = []
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", clean, flags=re.I | re.S):
        cells = [re.sub(r"<[^>]+>", "", cell).strip() for cell in re.findall(r"<td\b[^>]*>(.*?)</td>", row, flags=re.I | re.S)]
        if len(cells) < 4 or cells[0] not in PRIZE_TYPES:
            continue
        count = number(cells[1])
        amount = number(cells[-1])
        if amount:
            rows.append({"type": PRIZE_TYPES[cells[0]], "typenum": count, "typemoney": amount})
    return rows


def normalize_official_rows(payload):
    rows = payload.get("result") or payload.get("data") or []
    normalized = []
    for row in rows:
        issue = str(row.get("code") or row.get("issue") or "")
        prizes = []
        for prize in row.get("prizegrades") or []:
            prize_type = number(prize.get("type"))
            amount = number(prize.get("typemoney"))
            if prize_type and amount:
                prizes.append({
                    "type": prize_type,
                    "typenum": number(prize.get("typenum")),
                    "typemoney": amount,
                })
        if issue and prizes:
            normalized.append({"issue": issue, "prizes": prizes})
    return normalized


def fetch_official_rows():
    return normalize_official_rows(json.loads(fetch_text(OFFICIAL_URL)))


def fallback_issues():
    page = fetch_text(FALLBACK_LIST_URL)
    return list(dict.fromkeys(re.findall(r"/kjh/6/(\d+)\.html", page)))


def fetch_fallback_row(issue):
    prizes = parse_detail_html(fetch_text(FALLBACK_DETAIL_URL.format(issue=issue)))
    return {"issue": issue, "prizes": prizes} if prizes else None


def load_existing():
    if not OUTPUT.exists():
        return []
    try:
        payload = json.loads(OUTPUT.read_text(encoding="utf-8"))
        return payload.get("data") or []
    except (OSError, ValueError):
        return []


def main():
    by_issue = {str(row["issue"]): row for row in load_existing() if row.get("issue")}
    sources = []

    try:
        official_rows = fetch_official_rows()
        for row in official_rows:
            by_issue[row["issue"]] = row
        if official_rows:
            sources.append("中国福利彩票发行管理中心")
    except Exception as error:
        print(f"Official source unavailable: {error}")

    issues = fallback_issues()
    refresh = set(issues[:5])
    needed = [issue for issue in issues if issue not in by_issue or issue in refresh]
    if needed:
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {executor.submit(fetch_fallback_row, issue): issue for issue in needed}
            for future in as_completed(futures):
                issue = futures[future]
                try:
                    row = future.result()
                    if row:
                        by_issue[issue] = row
                except Exception as error:
                    print(f"Fallback issue {issue} unavailable: {error}")
        sources.append("8300.cn 开奖详情")

    data = sorted(by_issue.values(), key=lambda row: int(row["issue"]), reverse=True)
    if not data:
        raise RuntimeError("No prize data could be synchronized")

    payload = {
        "last_updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "、".join(sources) or "历史同步数据",
        "data": data,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(data)} prize records to {OUTPUT}")


if __name__ == "__main__":
    main()
