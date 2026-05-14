"""
데이터 검증 스크립트
DB 데이터 상태 점검 + 이상치 감지 보고서 출력

사용법:
  python3 scripts/validate_data.py
"""

import os
from dotenv import load_dotenv
from supabase import create_client
from loguru import logger

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def check_members(supabase) -> list[str]:
    issues = []

    res = supabase.table("members").select("id", count="exact").execute()
    count = res.count
    logger.info(f"[members] 총 {count}명")
    if count < 250:
        issues.append(f"의원 수 이상: {count}명 (정상 280~300)")

    no_party = supabase.table("members").select("id", count="exact").is_("party", "null").execute().count
    if no_party > 10:
        issues.append(f"정당 없는 의원: {no_party}명")

    no_photo = supabase.table("members").select("id", count="exact").is_("photo_url", "null").execute().count
    logger.info(f"[members] 사진 없음: {no_photo}명")

    return issues


def check_bills(supabase) -> list[str]:
    issues = []

    res = supabase.table("bills").select("id", count="exact").execute()
    count = res.count
    logger.info(f"[bills] 총 {count}건")
    if count < 10000:
        issues.append(f"법안 수 이상: {count}건 (정상 15,000+)")

    no_status = supabase.table("bills").select("id", count="exact").is_("status", "null").execute().count
    if no_status > 100:
        issues.append(f"상태 없는 법안: {no_status}건")

    no_title = supabase.table("bills").select("id", count="exact").is_("title", "null").execute().count
    if no_title > 0:
        issues.append(f"제목 없는 법안: {no_title}건")

    # 상태별 분포
    for status in ["가결", "계류", "폐기", "부결", "수정가결", "철회"]:
        cnt = supabase.table("bills").select("id", count="exact").eq("status", status).execute().count
        logger.info(f"[bills] {status}: {cnt}건")

    return issues


def check_votes(supabase) -> list[str]:
    issues = []

    res = supabase.table("votes").select("id", count="exact").execute()
    count = res.count
    logger.info(f"[votes] 총 {count}건")
    if count < 100:
        issues.append(f"표결 수 이상: {count}건 (정상 1,000+)")

    no_result = supabase.table("votes").select("id", count="exact").is_("result", "null").execute().count
    if no_result > 50:
        issues.append(f"결과 없는 표결: {no_result}건")

    return issues


def main() -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("=== PoliScope 데이터 검증 시작 ===")

    all_issues = []
    all_issues.extend(check_members(supabase))
    all_issues.extend(check_bills(supabase))
    all_issues.extend(check_votes(supabase))

    logger.info("=== 검증 완료 ===")
    if all_issues:
        logger.warning(f"이상 항목 {len(all_issues)}개:")
        for issue in all_issues:
            logger.warning(f"  ⚠ {issue}")
    else:
        logger.success("이상 없음 — 모든 데이터 정상")


if __name__ == "__main__":
    main()
