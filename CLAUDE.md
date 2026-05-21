# PoliScope

대한민국 22대 국회 투명성 플랫폼. 의원·법안·표결 데이터를 시민 언어로 제공.
**도메인:** poliscope.kr | **DB:** Supabase | **배포:** Vercel (`vercel --prod`)

## 주요 명령어

```bash
npm run dev          # 개발 서버
python3 scripts/sync_photos.py     # 의원 사진 URL 수집
python3 scripts/migrate_photos.py  # Supabase Storage에 사진 업로드
vercel --prod        # 프로덕션 배포
```

## 현재 상태 (2026-05-21)

완료된 페이지: 랜딩, 지역 상세, 의원 목록/상세, 법안 목록/상세, 표결 목록
남은 작업: 표결 상세(`/votes/[id]`), AI 요약 파이프라인

## 절대 하지 말 것

- `design/poliscope.html` 수정 금지 (디자인 참조 전용)
- `.env.local` 값 하드코딩 금지
- `collect_members.py`에 `photo_url` 필드 추가 금지 (사진은 sync → migrate 스크립트로만)
- 색상 하드코딩 금지 — CSS 변수만: `var(--iv)`, `var(--t1)`, `var(--bd)` 등

## 코드 규칙

- TypeScript strict mode
- 스타일은 inline style + CSS 변수 (Tailwind는 보조)
- 색상 참조: `design/poliscope.html`

## 사진 파이프라인

assembly.go.kr `/new/` 경로가 고화질(458x640). 품질 문제 생기면:
1. `python3 scripts/sync_photos.py` — 최신 URL 수집
2. `python3 scripts/migrate_photos.py` — Supabase에 업로드

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ASSEMBLY_API_KEY
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
BEEHIIV_API_KEY
BEEHIIV_PUBLICATION_ID
```

자세한 내용은 `INSTRUCTIONS.md` 참조.
