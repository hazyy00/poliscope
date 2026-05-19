"""
의원 사진 동기화 스크립트
assembly.go.kr/members/22nd/{ENG_NM} 페이지에서 사진 URL 추출 → Supabase 저장
"""

import os
import asyncio
import re
import httpx
from dotenv import load_dotenv
from supabase import create_client
from loguru import logger
from tqdm import tqdm

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

ASSEMBLY_API_KEY = os.environ["ASSEMBLY_API_KEY"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

BASE_URL = "https://open.assembly.go.kr/portal/openapi"
PHOTO_BASE = "https://www.assembly.go.kr"
DELAY = 0.2  # 요청 간 딜레이 (초)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

PHOTO_PATTERN = re.compile(
    r'background-image:\s*url\([\'"]?(\/static\/portal\/img\/openassm\/[^\'\")]+)[\'"]?\)'
)


async def fetch_members_from_api(client: httpx.AsyncClient) -> list[dict]:
    """API에서 의원 목록 (MONA_CD + ENG_NM) 가져오기"""
    params = {"KEY": ASSEMBLY_API_KEY, "Type": "json", "pSize": 300, "AGE": 22}
    resp = await client.get(f"{BASE_URL}/nwvrqwxyaytdsfvhu", params=params)
    resp.raise_for_status()
    data = resp.json()
    rows_wrapper = data.get("nwvrqwxyaytdsfvhu", [])
    if len(rows_wrapper) < 2:
        return []
    return rows_wrapper[1].get("row", [])


async def fetch_photo_url(client: httpx.AsyncClient, eng_nm: str) -> str | None:
    """의원 프로필 페이지에서 사진 URL 추출"""
    name_slug = eng_nm.replace(" ", "")
    url = f"{PHOTO_BASE}/members/22nd/{name_slug}"
    try:
        resp = await client.get(url, headers=HEADERS)
        if resp.status_code != 200:
            return None
        match = PHOTO_PATTERN.search(resp.text)
        if match:
            return PHOTO_BASE + match.group(1)
    except Exception as e:
        logger.warning(f"사진 fetch 실패 ({eng_nm}): {e}")
    return None


async def main() -> None:
    logger.info("의원 사진 동기화 시작")

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        raw_list = await fetch_members_from_api(client)
    logger.info(f"API 의원 수: {len(raw_list)}명")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    success = 0
    fail = 0

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        for raw in tqdm(raw_list, desc="사진 수집"):
            mona_cd = raw.get("MONA_CD", "")
            eng_nm = raw.get("ENG_NM", "")
            name = raw.get("HG_NM", "")

            if not eng_nm:
                logger.warning(f"영문명 없음: {name}")
                fail += 1
                continue

            photo_url = await fetch_photo_url(client, eng_nm)

            if photo_url:
                supabase.table("members").update({"photo_url": photo_url}).eq("id", mona_cd).execute()
                success += 1
            else:
                logger.warning(f"사진 없음: {name} ({eng_nm})")
                fail += 1

            await asyncio.sleep(DELAY)

    logger.success(f"완료 — 성공: {success}명, 실패: {fail}명")


if __name__ == "__main__":
    asyncio.run(main())
