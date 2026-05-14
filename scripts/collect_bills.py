"""
국회 법안 수집 스크립트
open.assembly.go.kr API → Supabase bills 테이블

사용법:
  python3 scripts/collect_bills.py --full          # 전체 수집
  python3 scripts/collect_bills.py --since 2024-01-01  # 특정 날짜 이후
  python3 scripts/collect_bills.py                 # 어제 이후 (기본)
"""

import os
import asyncio
import argparse
from datetime import date, timedelta
from typing import Optional
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from supabase import create_client
from loguru import logger
from tqdm import tqdm

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

ASSEMBLY_API_KEY = os.environ["ASSEMBLY_API_KEY"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

BASE_URL = "https://open.assembly.go.kr/portal/openapi"
PAGE_SIZE = 100

STATUS_MAP = {
    "원안가결": "가결",
    "수정가결": "수정가결",
    "부결": "부결",
    "폐기": "폐기",
    "철회": "철회",
    "계류": "계류",
    "임기만료폐기": "폐기",
    "대안반영폐기": "폐기",
    "본회의불부의": "폐기",
}


class Bill(BaseModel):
    id: str
    title: str
    status: Optional[str] = None
    committee: Optional[str] = None
    proposer_id: Optional[str] = None
    proposed_at: Optional[str] = None
    passed_at: Optional[str] = None
    content_url: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return "계류"
        for key, mapped in STATUS_MAP.items():
            if key in v:
                return mapped
        return "계류"

    @field_validator("proposed_at", "passed_at", mode="before")
    @classmethod
    def normalize_date(cls, v: Optional[str]) -> Optional[str]:
        if not v or len(v) < 8:
            return None
        # YYYYMMDD → YYYY-MM-DD
        v = v.strip()
        if len(v) == 8 and v.isdigit():
            return f"{v[:4]}-{v[4:6]}-{v[6:]}"
        return v

    def to_db(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "status": self.status,
            "committee": self.committee,
            "proposer_id": self.proposer_id,
            "proposed_at": self.proposed_at,
            "passed_at": self.passed_at,
            "content_url": self.content_url,
        }


def parse_bill(raw: dict) -> Optional[Bill]:
    bill_id = raw.get("BILL_ID") or raw.get("BILL_NO")
    title = raw.get("BILL_NM") or raw.get("BILL_NAME")
    if not bill_id or not title:
        return None

    return Bill(
        id=bill_id,
        title=title,
        status=raw.get("PROC_RESULT") or raw.get("PROC_RESULT_CD"),
        committee=raw.get("COMMITTEE") or raw.get("CURR_COMMITTEE"),
        proposer_id=raw.get("MONA_CD") or None,
        proposed_at=raw.get("PROPOSE_DT"),
        passed_at=raw.get("PROC_DT") or None,
        content_url=raw.get("LINK_URL") or raw.get("DETAIL_LINK") or None,
    )


async def fetch_page(
    client: httpx.AsyncClient, page: int, since: Optional[str] = None
) -> tuple[list[dict], int]:
    params = {
        "KEY": ASSEMBLY_API_KEY,
        "Type": "json",
        "AGE": 22,
        "pIndex": page,
        "pSize": PAGE_SIZE,
    }
    if since:
        params["PROPOSE_DT"] = since

    resp = await client.get(f"{BASE_URL}/nzmimeepazxkubdpn", params=params)
    resp.raise_for_status()
    data = resp.json()

    wrapper = data.get("nzmimeepazxkubdpn", [])
    if len(wrapper) < 2:
        return [], 0

    head = wrapper[0].get("head", [])
    result_code = head[1].get("RESULT", {}).get("CODE", "") if len(head) > 1 else ""
    if result_code not in ("INFO-000", "INFO-200"):
        logger.warning(f"API: {head}")
        return [], 0

    total = int(head[0].get("list_total_count", 0)) if head else 0
    rows = wrapper[1].get("row", [])
    return rows, total


async def fetch_all(since: Optional[str] = None) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        # 첫 페이지로 총 건수 확인
        first_rows, total = await fetch_page(client, 1, since)
        if total == 0:
            return first_rows

        total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
        logger.info(f"총 {total}건 / {total_pages}페이지")

        all_rows = list(first_rows)

        # 나머지 페이지 병렬 수집 (10페이지씩 묶어서)
        for batch_start in tqdm(range(2, total_pages + 1, 10), desc="수집 중"):
            batch_pages = range(batch_start, min(batch_start + 10, total_pages + 1))
            tasks = [fetch_page(client, p, since) for p in batch_pages]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, Exception):
                    logger.warning(f"페이지 수집 실패: {result}")
                    continue
                rows, _ = result
                all_rows.extend(rows)

        return all_rows


def upsert_bills(bills: list[Bill]) -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows = [b.to_db() for b in bills]

    batch_size = 100
    for i in tqdm(range(0, len(rows), batch_size), desc="저장 중"):
        batch = rows[i : i + batch_size]
        supabase.table("bills").upsert(batch, on_conflict="id").execute()


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true", help="전체 수집")
    parser.add_argument("--since", type=str, help="YYYY-MM-DD 이후 수집")
    args = parser.parse_args()

    if args.full:
        since = None
        logger.info("전체 법안 수집 시작 (17,000+건, 시간 걸림)")
    elif args.since:
        since = args.since.replace("-", "")
        logger.info(f"{args.since} 이후 법안 수집")
    else:
        yesterday = (date.today() - timedelta(days=1)).strftime("%Y%m%d")
        since = yesterday
        logger.info(f"어제({yesterday}) 이후 법안 수집")

    raw_list = await fetch_all(since)
    logger.info(f"API 응답: {len(raw_list)}건")

    bills = []
    for raw in raw_list:
        bill = parse_bill(raw)
        if bill:
            bills.append(bill)
        else:
            logger.debug(f"파싱 스킵: {raw}")

    logger.info(f"파싱 성공: {len(bills)}건")
    upsert_bills(bills)
    logger.success(f"완료: {len(bills)}건 저장")


if __name__ == "__main__":
    asyncio.run(main())
