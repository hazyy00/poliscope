"""
국회 표결 수집 스크립트
open.assembly.go.kr API → Supabase votes + member_votes 테이블

사용법:
  python3 scripts/collect_votes.py --full
  python3 scripts/collect_votes.py --since 2024-01-01
  python3 scripts/collect_votes.py
"""

import os
import asyncio
import argparse
from datetime import date, timedelta
from typing import Optional
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, field_validator
from supabase import create_client
from loguru import logger
from tqdm import tqdm

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

ASSEMBLY_API_KEY = os.environ["ASSEMBLY_API_KEY"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

BASE_URL = "https://open.assembly.go.kr/portal/openapi"
PAGE_SIZE = 100

RESULT_MAP = {
    "원안가결": "가결",
    "수정가결": "가결",
    "부결": "부결",
    "폐기": "폐기",
    "무효": "무효",
}

STANCE_MAP = {
    "찬성": "찬성",
    "반대": "반대",
    "기권": "기권",
    "불참": "불참",
    "결석": "불참",
}


class Vote(BaseModel):
    id: str
    bill_id: Optional[str] = None
    title: str
    voted_at: Optional[str] = None
    result: Optional[str] = None
    yes_count: int = 0
    no_count: int = 0
    abstain_count: int = 0
    absent_count: int = 0

    @field_validator("result", mode="before")
    @classmethod
    def normalize_result(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        for key, mapped in RESULT_MAP.items():
            if key in v:
                return mapped
        return None

    @field_validator("voted_at", mode="before")
    @classmethod
    def normalize_date(cls, v: Optional[str]) -> Optional[str]:
        if not v or len(v) < 8:
            return None
        v = v.strip()
        if len(v) == 8 and v.isdigit():
            return f"{v[:4]}-{v[4:6]}-{v[6:]}T00:00:00+09:00"
        return v

    def to_db(self) -> dict:
        return {
            "id": self.id,
            "bill_id": self.bill_id,
            "title": self.title,
            "voted_at": self.voted_at,
            "result": self.result,
            "yes_count": self.yes_count,
            "no_count": self.no_count,
            "abstain_count": self.abstain_count,
            "absent_count": self.absent_count,
        }


def parse_vote(raw: dict) -> Optional[Vote]:
    vote_id = raw.get("BILL_ID")
    title = raw.get("BILL_NM")
    if not vote_id or not title:
        return None

    return Vote(
        id=vote_id,
        bill_id=None,  # bills 테이블과 ID 형식 불일치, 추후 매핑
        title=title,
        voted_at=raw.get("LAW_PROC_DT") or raw.get("PROC_DT"),
        result=raw.get("PROC_RESULT_CD"),
        yes_count=int(raw.get("YES_TCNT") or 0),
        no_count=int(raw.get("NO_TCNT") or 0),
        abstain_count=int(raw.get("BLANK_TCNT") or 0),
        absent_count=0,
    )


async def fetch_votes_page(
    client: httpx.AsyncClient, page: int, since: Optional[str]
) -> tuple[list[dict], int]:
    params = {
        "KEY": ASSEMBLY_API_KEY,
        "Type": "json",
        "AGE": 22,
        "pIndex": page,
        "pSize": PAGE_SIZE,
    }
    if since:
        params["LAW_PROC_DT"] = since

    resp = await client.get(f"{BASE_URL}/nwbpacrgavhjryiph", params=params)
    resp.raise_for_status()
    data = resp.json()

    wrapper = data.get("nwbpacrgavhjryiph", [])
    if len(wrapper) < 2:
        return [], 0

    head = wrapper[0].get("head", [])
    result_code = head[1].get("RESULT", {}).get("CODE", "") if len(head) > 1 else ""
    if result_code not in ("INFO-000", "INFO-200"):
        return [], 0

    total = int(head[0].get("list_total_count", 0)) if head else 0
    return wrapper[1].get("row", []), total


async def fetch_member_votes_page(
    client: httpx.AsyncClient, vote_id: str, page: int
) -> tuple[list[dict], int]:
    params = {
        "KEY": ASSEMBLY_API_KEY,
        "Type": "json",
        "BILL_ID": vote_id,
        "pIndex": page,
        "pSize": 300,
    }
    resp = await client.get(f"{BASE_URL}/ncocpgfiaotvspot", params=params)
    resp.raise_for_status()
    data = resp.json()

    wrapper = data.get("ncocpgfiaotvspot", [])
    if len(wrapper) < 2:
        return [], 0
    head = wrapper[0].get("head", [])
    total = int(head[0].get("list_total_count", 0)) if head else 0
    return wrapper[1].get("row", []), total


async def fetch_all_votes(since: Optional[str]) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        first_rows, total = await fetch_votes_page(client, 1, since)
        if total == 0:
            return first_rows

        total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
        logger.info(f"표결 총 {total}건 / {total_pages}페이지")

        all_rows = list(first_rows)
        for batch_start in tqdm(range(2, total_pages + 1, 10), desc="표결 수집"):
            pages = range(batch_start, min(batch_start + 10, total_pages + 1))
            results = await asyncio.gather(
                *[fetch_votes_page(client, p, since) for p in pages],
                return_exceptions=True,
            )
            for r in results:
                if isinstance(r, Exception):
                    logger.warning(f"페이지 실패: {r}")
                    continue
                all_rows.extend(r[0])

    return all_rows


def upsert_votes(votes: list[Vote]) -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows = [v.to_db() for v in votes]
    batch_size = 100
    for i in tqdm(range(0, len(rows), batch_size), desc="표결 저장"):
        supabase.table("votes").upsert(rows[i : i + batch_size], on_conflict="id").execute()


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true")
    parser.add_argument("--since", type=str)
    args = parser.parse_args()

    if args.full:
        since = None
        logger.info("표결 전체 수집 시작")
    elif args.since:
        since = args.since.replace("-", "")
        logger.info(f"{args.since} 이후 표결 수집")
    else:
        since = (date.today() - timedelta(days=1)).strftime("%Y%m%d")
        logger.info(f"어제({since}) 이후 표결 수집")

    raw_list = await fetch_all_votes(since)
    logger.info(f"API 응답: {len(raw_list)}건")

    votes = []
    for raw in raw_list:
        v = parse_vote(raw)
        if v:
            votes.append(v)

    logger.info(f"파싱 성공: {len(votes)}건")
    upsert_votes(votes)
    logger.success(f"완료: {len(votes)}건 저장")


if __name__ == "__main__":
    asyncio.run(main())
