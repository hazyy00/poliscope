"""
의원 사진 → Supabase Storage 마이그레이션
assembly.go.kr 이미지를 다운받아 Supabase Storage 'photos' 버킷에 업로드
"""

import os
import asyncio
import httpx
from dotenv import load_dotenv
from supabase import create_client
from loguru import logger
from tqdm import tqdm

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "photos"
DELAY = 0.1

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}


async def main() -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # photo_url 있는 의원 전체 조회
    rows = supabase.table("members").select("id, name, photo_url").not_.is_("photo_url", "null").execute()
    members = rows.data
    logger.info(f"사진 있는 의원: {len(members)}명")

    success = 0
    fail = 0

    async with httpx.AsyncClient(timeout=30, follow_redirects=True, headers=HEADERS) as client:
        for m in tqdm(members, desc="업로드"):
            member_id = m["id"]
            name = m["name"]
            old_url = m["photo_url"]

            # 이미 Supabase URL이면 스킵
            if "supabase" in old_url:
                success += 1
                continue

            try:
                # 이미지 다운로드
                resp = await client.get(old_url)
                if resp.status_code != 200:
                    logger.warning(f"다운로드 실패 ({name}): {resp.status_code}")
                    fail += 1
                    continue

                content_type = resp.headers.get("content-type", "image/jpeg")
                ext = "png" if "png" in content_type else "jpg"
                file_path = f"{member_id}.{ext}"
                image_bytes = resp.content

                # Supabase Storage 업로드
                supabase.storage.from_(BUCKET).upload(
                    path=file_path,
                    file=image_bytes,
                    file_options={"content-type": content_type, "upsert": "true"},
                )

                # 공개 URL 가져오기
                public_url = supabase.storage.from_(BUCKET).get_public_url(file_path)

                # DB 업데이트
                supabase.table("members").update({"photo_url": public_url}).eq("id", member_id).execute()

                success += 1

            except Exception as e:
                logger.warning(f"실패 ({name}): {e}")
                fail += 1

            await asyncio.sleep(DELAY)

    logger.success(f"완료 — 성공: {success}명, 실패: {fail}명")


if __name__ == "__main__":
    asyncio.run(main())
