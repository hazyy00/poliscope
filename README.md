# PoliScope

> 데이터로 보는 민주주의 — 대한민국 국회 투명성 플랫폼

poliscope.kr

---

## 무엇을 만드는가

22대 국회 300명 의원의 발의·표결·출석을 누구나 쉽게 검색하고 볼 수 있는 웹서비스.
기존 의안정보시스템은 존재하지만 일반 시민이 쓰기 어렵다. 정보 불균형이 정치 양극화의 한 원인이라는 진단에서 출발.

**차별점:** 좌도 우도 아닌 중립 포지셔닝. AI가 법조문을 직장인·자영업자·학생 언어로 풀어내는 페르소나 해석.

---

## 빠른 시작

```bash
# 1. 레포 클론
git clone https://github.com/your-id/poliscope.git
cd poliscope

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 편집 (아래 환경변수 섹션 참조)

# 3. 프론트엔드 의존성
npm install

# 4. Python 의존성 (데이터 수집용)
pip install -r requirements.txt

# 5. 개발 서버
npm run dev
```

---

## 환경변수

`.env.local` 에 아래 값 입력:

```bash
# 국회 공공데이터 API (open.assembly.go.kr 에서 발급)
ASSEMBLY_API_KEY=

# Supabase (supabase.com 에서 프로젝트 생성)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (console.anthropic.com)
ANTHROPIC_API_KEY=

# Upstash Redis (upstash.com)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 데이터 수집

### 최초 전체 수집 (처음 한 번만)

```bash
# 의원 300명
python scripts/collect_members.py

# 법안 전체 (17,000+건, 시간 걸림)
python scripts/collect_bills.py --full

# 표결 전체
python scripts/collect_votes.py --full

# AI 요약 배치 생성 (법안당 약 $0.004, 전체 약 $70)
python scripts/generate_summaries.py --batch-size 50
```

### 일별 증분 수집 (Vercel Cron이 자동 실행)

```bash
python scripts/collect_bills.py --since yesterday
python scripts/collect_votes.py --since yesterday
python scripts/generate_summaries.py --unsummarized-only
```

### 데이터 검증

```bash
python scripts/validate_data.py
# 누락 의원, 이상 법안수, 환각 샘플링 보고서 출력
```

---

## 데이터베이스 설정

Supabase SQL 에디터에서 실행:

```bash
# 스키마 적용
cat supabase/schema.sql | pbcopy
# Supabase Dashboard > SQL Editor > 붙여넣기 > Run
```

pgvector 확장 활성화:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 프로젝트 구조

```
poliscope/
├── app/                    # Next.js 14 App Router
│   ├── (landing)/page.tsx  # 메인 랜딩
│   ├── members/            # 의원 검색·프로필
│   ├── bills/              # 법안 검색·상세
│   ├── votes/              # 표결 목록·상세
│   ├── map/                # 지역구 지도
│   └── api/                # API Routes
├── components/             # React 컴포넌트
├── scripts/                # Python 데이터 수집
├── supabase/               # DB 스키마·마이그레이션
├── design/                 # UI 목업 (참조용)
│   └── poliscope.html      # 완성된 디자인
├── public/
│   └── korea-provinces.json
├── requirements.txt
└── INSTRUCTIONS.md         # Claude Code용 상세 지침
```

---

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 (지도 인터랙션, 통계, 기능 소개) |
| `/members` | 의원 검색 (이름·지역구·정당 필터) |
| `/members/[id]` | 의원 상세 (발의·표결·출석·재산) |
| `/bills` | 법안 검색 (상태·위원회 필터) |
| `/bills/[id]` | 법안 상세 (AI 요약·원문 링크) |
| `/votes` | 표결 목록 |
| `/votes/[id]` | 표결 상세 (정당별 찬반) |
| `/map` | 전국 지역구 지도 |

---

## AI 요약 품질 관리

모든 AI 요약은 사전생성 + 검증 후 DB 저장. 실시간 생성 없음.

- 신뢰도 < 0.7 → 저장 안 함, 원문 링크만 표시
- 사용자 신고 5건 누적 → 자동 숨김
- 매월 랜덤 50건 수동 검수

---

## 기술 결정 로그

**왜 Next.js 14?** App Router의 서버 컴포넌트로 초기 로드 성능 확보. SSG로 법안·의원 페이지 정적 생성.

**왜 Supabase?** PostgreSQL + pgvector + 실시간 구독 + 무료 티어. 혼자 운영하기 적합.

**왜 Haiku로 요약?** Sonnet 대비 1/5 비용, 법조문 요약 품질 차이 미미. 100건 블라인드 테스트 결과.

**왜 배치 API?** 50% 비용 절감. 사전생성이라 지연 무관.

---

## 로드맵

- **0~3개월:** 데이터 파이프라인 + 검색/프로필 + AI 요약 (MVP)
- **3~6개월:** 페르소나별 해석 AI 레이어
- **6~9개월:** 스타트업 규제 내비게이터 B2B 파일럿
- **9~12개월:** 트랙션에 따라 방향 결정

---

## 법적 고지

이 서비스의 데이터는 국회 공공데이터 API 기반이며, AI 요약은 참고용입니다.
법적 판단의 근거로 사용하지 마세요. 원문은 항상 의안정보시스템(likms.assembly.go.kr)에서 확인하세요.

국회 의안 본문은 저작권법 제7조에 따라 저작권 보호 대상이 아닙니다.

---

## 기여

현재 1인 개발 중. 버그 제보는 GitHub Issues로.

오류가 있는 AI 요약은 각 법안 페이지의 "이 요약이 틀렸어요" 버튼으로 신고해주세요.
