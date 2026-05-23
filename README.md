# PoliScope

**대한민국 국회 투명성 플랫폼** · [poliscope.kr](https://poliscope.kr)

22대 국회 의원 286명의 발의·표결·출석 기록을 누구나 쉽게 검색하고 볼 수 있는 웹서비스입니다.

---

## 왜 만들었나요?

국회 의안정보시스템(likms.assembly.go.kr)은 데이터가 있지만 일반 시민이 쓰기 어렵습니다. 어떤 의원이 어떤 법안을 발의했는지, 어떤 표결에서 어떻게 찍었는지 찾아보려면 여러 페이지를 오가야 합니다.

PoliScope는 이 데이터를 한곳에서 쉽게 검색할 수 있도록 정리합니다. 좌도 우도 아닌 중립 포지셔닝으로, 데이터 그대로를 보여줍니다.

**일반 서비스와의 차이점:**
- 국회 공공 API 데이터를 매일 자동 수집해 항상 최신 상태를 유지합니다
- AI가 복잡한 법조문을 직장인·자영업자·학생 언어로 풀어서 설명합니다
- AI 요약은 사전 생성 후 원문 대조 검증을 거쳐 저장됩니다. 환각 방지가 핵심입니다

---

## 주요 기능

| 페이지 | 기능 |
|--------|------|
| `/` | 메인 랜딩. 전국 지역구 SVG 지도 인터랙션 (클릭 시 지역 상세로 이동) |
| `/regions/[name]` | 지역 상세. 시장·도지사 카드, 의석 분포 바, 지역구 의원 그리드 |
| `/members` | 의원 검색. 이름·지역구·정당 필터. 시장·도지사 섹션 포함 |
| `/members/[id]` | 의원 상세 프로필. 발의 법안, 표결 이력, 출석률, 재산 |
| `/bills` | 법안 검색. 상태 카드 5분할(전체·가결·부결·폐기·계류), 발의일·표결일·접전순 정렬, 위원회 필터 |
| `/bills/[id]` | 법안 상세. 표결 결과(286명 기준 stacked bar), 정당별 찬반, 의원 도트 그리드, AI 요약 |
| `/votes` | 301 redirect → `/bills?status=passed&sort=voteDate` |

---

## 기술 스택

**프론트엔드**
- Next.js 16 (App Router), TypeScript, Tailwind CSS (보조)
- Recharts, D3.js + TopoJSON (지역구 지도)
- 폰트: Noto Serif KR, Noto Sans KR, IM Fell English, JetBrains Mono

**백엔드 및 인프라**
- Supabase (PostgreSQL + pgvector)
- Upstash Redis (캐싱)
- GitHub Actions (매일 새벽 3시 데이터 수집 크론잡)
- Vercel (배포)

**AI**
- Claude Haiku: 법안 배치 요약 (사전 생성, 비용 최적화)
- Claude Sonnet: 향후 실시간 Q&A 기능 (MAU 증가 후)

---

## 로컬 실행

```bash
# 1. 레포 클론
git clone https://github.com/hazyy00/poliscope.git
cd poliscope

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 각 항목 입력 (아래 환경변수 섹션 참조)

# 3. 프론트엔드 의존성 설치
npm install

# 4. Python 의존성 설치 (데이터 수집 스크립트용)
pip install -r requirements.txt

# 5. 개발 서버 실행
npm run dev
# http://localhost:3000 접속
```

---

## 환경변수

`.env.local` 파일에 아래 값을 입력합니다.

```bash
# 국회 공공데이터 API
# 발급: https://open.assembly.go.kr -> 오픈API -> 인증키 발급 (무료)
ASSEMBLY_API_KEY=

# Supabase
# 발급: https://supabase.com -> 프로젝트 생성 -> Settings -> API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic Claude API
# 발급: https://console.anthropic.com -> API Keys
ANTHROPIC_API_KEY=

# Upstash Redis (선택, 캐싱용)
# 발급: https://upstash.com -> Redis 데이터베이스 생성
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 데이터베이스 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. Supabase 대시보드 > SQL Editor 열기
3. `schema.sql` 내용을 붙여넣고 실행

```bash
# macOS에서 클립보드로 복사
cat schema.sql | pbcopy
```

---

## 데이터 수집

### 최초 전체 수집 (처음 한 번)

```bash
# 의원 정보 수집 (약 286명)
python3 scripts/collect_members.py

# 법안 전체 수집 (17,000+건, 수 분 소요)
python3 scripts/collect_bills.py --full

# 표결 기록 전체 수집
python3 scripts/collect_votes.py --full

# 데이터 이상 여부 확인
python3 scripts/validate_data.py
```

### 일별 증분 수집

GitHub Actions가 매일 새벽 3시(KST)에 자동 실행합니다. 수동으로 실행하려면:

```bash
python3 scripts/collect_bills.py --since 2024-01-01
python3 scripts/collect_votes.py --since 2024-01-01
```

GitHub Actions 자동 실행을 위해 Repository > Settings > Secrets에 아래 항목을 등록해야 합니다:
`ASSEMBLY_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## AI 요약 품질 관리

모든 AI 요약은 실시간 생성이 아닌 사전 배치 생성 방식입니다.

- 신뢰도 점수 0.7 미만이면 저장하지 않고 원문 링크만 표시합니다
- 사용자 신고 5건 누적 시 자동으로 숨깁니다
- 매월 랜덤 50건을 수동 검수합니다
- 모든 AI 요약 옆에 "AI 생성 요약입니다. 법적 판단 근거로 사용하지 마세요." 문구를 표시합니다

---

## 프로젝트 구조

```
poliscope/
├── app/                        # Next.js App Router
│   ├── (landing)/page.tsx      # 메인 랜딩 페이지 (인터랙티브 지도)
│   ├── regions/[name]/         # 지역 상세 페이지 (시장·도지사 + 지역구 의원)
│   ├── members/                # 의원 검색 및 프로필
│   ├── bills/                  # 법안 목록·상세 (표결 포함, /votes는 redirect됨)
│   ├── votes/                  # 레거시 (next.config.js에서 /bills로 301 redirect)
│   └── api/                    # API Routes
├── components/
│   ├── map/
│   │   └── KoreaMap.tsx        # 인터랙티브 SVG 지도 (17개 시·도)
│   ├── members/
│   │   ├── MemberCard.tsx
│   │   ├── MemberSearch.tsx
│   │   └── GovernorCard.tsx    # 시장·도지사 카드
│   ├── bills/
│   │   ├── BillStatusCards.tsx # 5개 상태 카드 (전체·가결·부결·폐기·계류)
│   │   ├── BillFilterBar.tsx   # 검색+위원회 필터 + 정렬 토글
│   │   ├── BillRow.tsx         # 목록 행 (상태·제목·표결바·날짜 4열)
│   │   └── MemberVoteGrid.tsx  # 의원 도트 그리드 (법안 상세용)
│   └── ui/
├── lib/
│   ├── regions.ts              # 17개 시·도 데이터 (의석·시장·도지사, 민선 8기)
│   ├── supabase.ts
│   ├── types.ts
│   ├── constants.ts
│   └── utils.ts
├── scripts/                    # Python 데이터 수집 스크립트
├── design/
│   └── poliscope.html          # UI 목업 (참조용, 수정 금지)
├── schema.sql                  # Supabase DB 스키마
├── requirements.txt            # Python 의존성
└── .env.example                # 환경변수 예시
```

---

## 로드맵

- **1단계 ✅ 완료:** 데이터 파이프라인. 의원·법안·표결 데이터 매일 자동 수집
- **2단계 ✅ 완료:** 검색·프로필 UI. 의원·법안 페이지 완성. `/votes`를 `/bills`에 흡수 (발의→심사→표결 단일 흐름)
- **3단계 (진행 중):** AI 요약 레이어. 법안 요약, 페르소나별 해석, 유사 법안 추천, 큐레이션
- **이후:** 트랙션에 따라 방향 결정 (Q&A, 커뮤니티, 보고서 등)

---

## Acknowledgements

Inspired by [wooder2050/congressman](https://github.com/wooder2050/congressman).

---

## 법적 고지

이 서비스의 데이터는 국회 공공데이터 API를 기반으로 하며 참고용입니다. 법적 판단의 근거로 사용하지 마세요. 원문은 항상 [의안정보시스템](https://likms.assembly.go.kr)에서 확인하세요.

국회 의안 본문은 저작권법 제7조에 따라 저작권 보호 대상이 아닙니다.
