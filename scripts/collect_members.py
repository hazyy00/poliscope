"""
국회 의원 정보 수집 스크립트
open.assembly.go.kr API → Supabase members 테이블
"""

import os
import asyncio
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Optional
from supabase import create_client
from loguru import logger
from tqdm import tqdm

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

ASSEMBLY_API_KEY = os.environ["ASSEMBLY_API_KEY"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

BASE_URL = "https://open.assembly.go.kr/portal/openapi"


class Member(BaseModel):
    id: str = Field(alias="MONA_CD")
    name: str = Field(alias="HG_NM")
    name_en: Optional[str] = Field(default=None, alias="ENG_NM")
    party: Optional[str] = Field(default=None, alias="POLY_NM")
    district: Optional[str] = Field(default=None, alias="ORIG_NM")
    is_pr: bool = False
    photo_url: Optional[str] = Field(default=None, alias="JPG_URL")
    term: int = 22

    class Config:
        populate_by_name = True

    def to_db(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "name_en": self.name_en,
            "party": self.party,
            "district": self.district,
            "is_pr": self.is_pr,
            "term": self.term,
        }


async def fetch_members(client: httpx.AsyncClient) -> list[dict]:
    params = {
        "KEY": ASSEMBLY_API_KEY,
        "Type": "json",
        "pSize": 300,
        "AGE": 22,
    }
    resp = await client.get(f"{BASE_URL}/nwvrqwxyaytdsfvhu", params=params)
    resp.raise_for_status()
    data = resp.json()

    # API 응답 구조: { "nwvrqwxyaytdsfvhu": [ {head}, {row} ] }
    rows_wrapper = data.get("nwvrqwxyaytdsfvhu", [])
    if len(rows_wrapper) < 2:
        logger.error(f"Unexpected API response: {data}")
        return []

    head = rows_wrapper[0].get("head", [])
    result_code = head[1].get("RESULT", {}).get("CODE", "") if len(head) > 1 else ""
    if result_code != "INFO-000":
        logger.error(f"API error: {head}")
        return []

    return rows_wrapper[1].get("row", [])


def parse_member(raw: dict) -> Member:
    # 비례대표 판별: 지역구가 없거나 "비례대표" 포함
    district = raw.get("ORIG_NM", "")
    is_pr = not district or "비례" in district

    member = Member(
        **{
            "MONA_CD": raw.get("MONA_CD", ""),
            "HG_NM": raw.get("HG_NM", ""),
            "ENG_NM": raw.get("ENG_NM") or None,
            "POLY_NM": raw.get("POLY_NM") or None,
            "ORIG_NM": district or None,
            "JPG_URL": raw.get("JPG_URL") or None,
        }
    )
    member.is_pr = is_pr
    return member


def upsert_members(members: list[Member]) -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows = [m.to_db() for m in members]

    batch_size = 50
    for i in tqdm(range(0, len(rows), batch_size), desc="Upserting"):
        batch = rows[i : i + batch_size]
        supabase.table("members").upsert(batch, on_conflict="id").execute()


async def main() -> None:
    logger.info("의원 정보 수집 시작")
    async with httpx.AsyncClient(timeout=30) as client:
        raw_list = await fetch_members(client)

    logger.info(f"API 응답: {len(raw_list)}명")

    members = []
    for raw in raw_list:
        try:
            members.append(parse_member(raw))
        except Exception as e:
            logger.warning(f"파싱 실패: {raw.get('HG_NM')} — {e}")

    logger.info(f"파싱 성공: {len(members)}명")
    upsert_members(members)
    logger.success(f"완료: {len(members)}명 저장")


if __name__ == "__main__":
    asyncio.run(main())
