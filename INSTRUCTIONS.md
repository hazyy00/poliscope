# PoliScope — Claude Code Instructions

---

## Claude Code에게 — 세션 시작 시 반드시 읽을 것

### 1. 세션 시작 루틴 (매번, 순서대로)

```
1. INSTRUCTIONS.md (이 파일) 전체 읽기
2. README.md 읽기
3. 현재 작업 단계 확인 (아래 "빌드 순서" 섹션)
4. 해당 단계의 관련 파일만 읽기:
   - 0주차/1개월차: scripts/ 폴더 + supabase/schema.sql
   - 2개월차: app/ + components/ + design/poliscope.html
   - 3개월차: scripts/generate_summaries.py + lib/claude.ts
5. 사용자에게 "현재 [N단계]입니다. [다음 체크리스트 항목]부터 시작할까요?" 확인
```

### 2. 작업 방식 원칙

**파일 수정 전에:**
- 관련 파일 전체를 먼저 읽는다
- 수정 범위를 사용자에게 먼저 설명하고 승인받는다
- 한 번에 하나의 기능만 완성한다 (여러 파일 동시에 반쪽씩 건드리지 않음)

**코드 작성 시:**
- TypeScript strict mode 준수
- 컴포넌트 하나 만들면 반드시 동작 확인 후 다음으로
- `design/poliscope.html` 의 색상·폰트·간격을 그대로 따른다
- 색상은 CSS 변수로만: `var(--iv)`, `var(--pu)` 등 (하드코딩 금지)

**데이터 관련:**
- DB 스키마 변경 시 `supabase/schema.sql` 도 함께 업데이트
- API 응답은 반드시 `pydantic` 모델로 검증 후 저장
- 환경변수는 `.env.example` 에 키 이름만 추가 (값 절대 커밋 금지)

**막힐 때:**
- 국회 API 응답 형식이 다를 경우: `open.assembly.go.kr` 문서 먼저 확인
- Supabase 관련 에러: `lib/supabase.ts` 클라이언트 설정 확인
- AI 요약 품질 이슈: `INSTRUCTIONS.md` 의 시스템 프롬프트 섹션 참조

### 3. 절대 하지 말 것

- `design/poliscope.html` 수정 금지 (참조 전용)
- `.env.local` 의 실제 키값을 코드에 하드코딩 금지
- DB 스키마를 코드에서 직접 변경 금지 (migration 파일로만)
- 체크리스트 순서 건너뛰기 금지 (데이터 없이 UI 만들기 등)
- 한 세션에 2개월치 이상 작업 시도 금지

### 4. 파일 우선순위 맵

| 작업 | 읽어야 할 파일 |
|------|--------------|
| 전체 파악 | `INSTRUCTIONS.md` → `README.md` |
| DB 작업 | `schema.sql` → `lib/supabase.ts` |
| 데이터 수집 | `scripts/collect_*.py` → `.env.example` |
| AI 요약 | `scripts/generate_summaries.py` → `lib/claude.ts` |
| 랜딩 UI | `design/poliscope.html` → `app/(landing)/page.tsx` |
| 의원 페이지 | `components/members/` → `app/members/` |
| 법안 페이지 | `components/bills/` → `app/bills/` |
| 지도 컴포넌트 | `components/map/KoreaMap.tsx` |
| 지역 상세 페이지 | `lib/regions.ts` → `app/regions/[name]/page.tsx` |
| 시장·도지사 데이터 | `lib/regions.ts` (REGIONS_DATA의 governor 필드, 민선 8기 정적 데이터) |

---

## 프로젝트 개요

대한민국 국회 투명성 플랫폼. 22대 국회 의원·법안·표결 데이터를 시민 언어로 제공한다.
국회 공공데이터 API를 자동 수집해 검색 가능한 웹서비스로 만드는 것이 핵심.

**도메인:** poliscope.kr  
**디자인 레퍼런스:** `/design/poliscope.html` (완성된 목업)  
**색상 시스템:** 아이보리 배경 `#F2EDE4`, 검정 `#0F0F0D`, 퍼플 액센트 `#4A3F8F`

---

## 핵심 원칙 (절대 어기지 말 것)

1. **데이터 먼저, UI 나중** — DB에 데이터 없으면 UI 만들지 않는다
2. **사전생성 우선** — 사용자 요청마다 LLM 호출하지 않는다. 미리 생성해서 DB에 저장
3. **환각은 법적 리스크** — AI 요약에는 반드시 원문 링크와 면책 문구 포함
4. **중립 포지셔닝** — 코드·UI·텍스트 어디에도 특정 정당 편향 없음
5. **점진적 빌드** — 0주차 → 1개월 → 2개월 → 3개월 순서 엄수

---

## 기술 스택

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Map:** D3.js + TopoJSON (한국 행정구역)
- **Font:** Noto Serif KR, Noto Sans KR, IM Fell English (Google Fonts)

### Backend
- **API Routes:** Next.js API Routes (간단한 것) + Python 수집 스크립트
- **Database:** Supabase (PostgreSQL + pgvector)
- **Cache:** Upstash Redis
- **Cron:** Vercel Cron Jobs (또는 GitHub Actions)

### AI
- **요약 모델:** claude-haiku-4-5 (배치 API, 사전생성)
- **임베딩:** text-embedding-3-small (pgvector 저장)
- **실시간 Q&A:** claude-sonnet-4-6 (MAU 증가 후)

### 인프라
- **Hosting:** Vercel
- **DB:** Supabase (무료 티어 시작)
- **Analytics:** Plausible (프라이버시 친화적)
- **이메일 구독:** Beehiiv

---

## 디렉토리 구조

```
poliscope/
├── app/                          # Next.js App Router
│   ├── (landing)/
│   │   └── page.tsx              # 메인 랜딩 (인터랙티브 SVG 지도, 인트로 애니메이션)
│   ├── regions/
│   │   └── [name]/
│   │       └── page.tsx          # 지역 상세 (시장·도지사 + 의석분포 + 지역구 의원)
│   ├── members/
│   │   ├── page.tsx              # 의원 목록/검색 (시장·도지사 섹션 포함)
│   │   └── [id]/
│   │       └── page.tsx          # 의원 상세 프로필
│   ├── bills/
│   │   ├── page.tsx              # 법안 목록/검색
│   │   └── [id]/
│   │       └── page.tsx          # 법안 상세
│   ├── votes/
│   │   ├── page.tsx              # 표결 목록
│   │   └── [id]/
│   │       └── page.tsx          # 표결 상세
│   └── api/
│       └── subscribe/route.ts    # 뉴스레터 구독
├── components/
│   ├── map/
│   │   └── KoreaMap.tsx          # SVG 한국 지도 (17개 시·도, 클릭 시 지역 상세로 이동)
│   ├── members/
│   │   ├── MemberCard.tsx        # 의원 카드 (→ /members/[id])
│   │   ├── MemberSearch.tsx      # 이름·정당·지역 필터 (router.replace로 히스토리 최소화)
│   │   ├── GovernorCard.tsx      # 시장·도지사 카드 (→ /regions/[name])
│   │   ├── AttendanceChart.tsx
│   │   └── VotingRecord.tsx
│   ├── bills/
│   │   ├── BillCard.tsx
│   │   ├── BillSearch.tsx
│   │   └── AISummary.tsx
│   └── ui/
│       ├── PartyBadge.tsx
│       ├── StatusBadge.tsx
│       └── Pagination.tsx
├── lib/
│   ├── regions.ts                # 17개 시·도 정적 데이터
│   │                             #   - 22대 총선 의석 (party, seats, rate, color)
│   │                             #   - 민선 8기 시장·도지사 (name, title, party, term)
│   ├── supabase.ts               # DB 클라이언트
│   ├── types.ts                  # Member, Bill, Vote 타입
│   ├── constants.ts              # PARTIES, BILL_STATUSES
│   └── utils.ts                  # getPartyColor, formatDate 등
├── scripts/                      # 데이터 수집 (Python)
│   ├── collect_members.py
│   ├── collect_bills.py
│   ├── collect_votes.py
│   ├── generate_summaries.py
│   └── validate_data.py
├── design/
│   └── poliscope.html            # 완성된 디자인 목업 (참조용, 수정 금지)
├── schema.sql                    # Supabase DB 스키마
├── requirements.txt              # Python 의존성
├── package.json
└── .env.local                    # 환경변수 (절대 커밋 금지)
```

---

## 데이터베이스 스키마

### members (의원)
```sql
CREATE TABLE members (
  id          TEXT PRIMARY KEY,          -- 국회 의원 고유번호
  name        TEXT NOT NULL,
  party       TEXT,
  district    TEXT,                      -- 지역구 (비례대표는 NULL)
  is_pr       BOOLEAN DEFAULT FALSE,     -- 비례대표 여부
  committee   TEXT[],                    -- 소속 위원회
  photo_url   TEXT,
  term        INTEGER DEFAULT 22,        -- 대수
  career      JSONB,                     -- 경력
  assets      JSONB,                     -- 재산
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### bills (법안)
```sql
CREATE TABLE bills (
  id              TEXT PRIMARY KEY,      -- 의안번호
  title           TEXT NOT NULL,
  status          TEXT,                  -- 계류/가결/폐기/철회
  committee       TEXT,
  proposer_id     TEXT REFERENCES members(id),
  proposed_at     DATE,
  passed_at       DATE,
  content_url     TEXT,                  -- 원문 링크
  ai_summary      TEXT,                  -- AI 요약 (사전생성)
  ai_summary_at   TIMESTAMPTZ,          -- 생성 시각
  embedding       vector(1536),          -- 유사 법안 검색용
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 공동발의자
CREATE TABLE bill_cosponsors (
  bill_id     TEXT REFERENCES bills(id),
  member_id   TEXT REFERENCES members(id),
  PRIMARY KEY (bill_id, member_id)
);
```

### votes (표결)
```sql
CREATE TABLE votes (
  id          TEXT PRIMARY KEY,
  bill_id     TEXT REFERENCES bills(id),
  title       TEXT NOT NULL,
  voted_at    TIMESTAMPTZ,
  result      TEXT,                      -- 가결/부결/폐기
  yes_count   INTEGER,
  no_count    INTEGER,
  abstain_count INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 개별 표결 기록
CREATE TABLE member_votes (
  vote_id     TEXT REFERENCES votes(id),
  member_id   TEXT REFERENCES members(id),
  stance      TEXT,                      -- 찬성/반대/기권/불참
  PRIMARY KEY (vote_id, member_id)
);
```

---

## 국회 API 연동

### 인증키 발급
1. `open.assembly.go.kr` → API 인증키 발급 (무료)
2. `data.go.kr` → 국회 관련 API 인증키 별도 발급

### 주요 엔드포인트
```python
BASE = "https://open.assembly.go.kr/portal/openapi"

# 의원 목록
GET {BASE}/nwvrqwxyaytdsfvhu?KEY={KEY}&Type=json&pSize=300&AGE=22

# 법안 목록  
GET {BASE}/nzmimeepazxkubdpn?KEY={KEY}&Type=json&AGE=22&pIndex=1&pSize=100

# 표결 목록
GET {BASE}/ncocpgfiaotvspot?KEY={KEY}&Type=json&pSize=100
```

### 수집 주기
- 의원 정보: 주 1회 (변동 적음)
- 법안 상태: 일 1회 (크론잡)
- 표결 기록: 일 1회
- AI 요약: 신규 법안 배치 처리 (일 1회 새벽)

---

## AI 요약 파이프라인

### 시스템 프롬프트 (환각 방어 핵심)
```
당신은 대한민국 국회 법안을 요약하는 도우미입니다.

규칙:
1. 원문에 없는 숫자, 고유명사, 인용문을 절대 만들지 마세요
2. 불확실한 내용은 "원문에서 확인되지 않음"으로 표시하세요
3. 요약은 반드시 원문에 근거하세요
4. 출력 형식은 JSON만 허용합니다

출력 JSON 형식:
{
  "summary": "3문장 이내 핵심 요약",
  "key_points": ["핵심 포인트 1", "핵심 포인트 2"],
  "personas": {
    "worker": "직장인에게 미치는 영향",
    "selfemployed": "자영업자에게 미치는 영향", 
    "student": "학생에게 미치는 영향"
  },
  "confidence": 0.0~1.0
}
```

### 배치 처리 스크립트 구조
```python
# scripts/generate_summaries.py
# 1. 요약 없는 법안 조회
# 2. 배치 API로 묶어서 처리 (50건씩)
# 3. 검증: 숫자/고유명사 원문 대조
# 4. 신뢰도 < 0.7이면 저장 안 함
# 5. 결과 DB 저장
```

### UI 면책 문구 (모든 AI 요약 옆에 필수)
```tsx
<Disclaimer>
  AI 생성 요약입니다. 법적 판단 근거로 사용하지 마세요.
  <Link href={bill.content_url}>원문 확인하기 →</Link>
</Disclaimer>
```

---

## 환경 변수 (.env.local)

```bash
# 국회 API
ASSEMBLY_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=poliscope.kr
```

---

## 빌드 순서 (MVP 3개월)

### 0주차: 세팅
- [ ] GitHub repo 생성, Vercel 연결
- [ ] Supabase 프로젝트 생성, 스키마 적용
- [ ] 국회 API 인증키 발급 및 테스트
- [ ] `.env.local` 세팅

### 1개월차: 데이터 파이프라인
- [ ] `collect_members.py` — 의원 300명 수집
- [ ] `collect_bills.py` — 법안 전체 수집 (17,000+건)
- [ ] `collect_votes.py` — 표결 기록 수집
- [ ] `validate_data.py` — 일별 diff, 이상치 감지
- [ ] Vercel Cron 설정 (매일 새벽 3시)
- [ ] **체크포인트:** DB에 데이터 들어오고 매일 자동 업데이트

### 2개월차: 검색·프로필 UI
- [ ] 랜딩 페이지 (`design/poliscope.html` 이식)
- [ ] 의원 검색 페이지 (이름·지역구·정당 필터)
- [ ] 의원 상세 프로필 (발의·표결·출석)
- [ ] 법안 검색·목록 (상태·위원회 필터)
- [ ] 법안 상세 (발의자·공동발의자·심사경과·원문 링크)
- [ ] 기본 SEO (sitemap, OG 메타태그)
- [ ] 이메일 구독 폼 (Beehiiv)
- [ ] **체크포인트:** 비로그인 사용자가 검색·열람 가능

### 3개월차: AI 레이어
- [ ] `generate_summaries.py` — 배치 AI 요약 생성
- [ ] 법안 상세에 AI 요약 표시 (면책 문구 포함)
- [ ] 페르소나별 해석 (직장인·자영업자·학생)
- [ ] 유사 법안 추천 (pgvector)
- [ ] 사용자 신고 버튼 ("이 요약이 틀렸어요")
- [ ] **체크포인트:** 공개 오픈, 첫 주 방문자 1,000명 목표

---

## 법적 주의사항

### 반드시 피해야 할 표현
- "이 법안은 당신에게 [결과]를 가져옵니다" → 단정 금지
- 의원 프로필에서 "친일", "친북" 등 가치판단 단어 금지
- 원문에 없는 내용을 인용문처럼 제시 금지

### 저작권
- 국회 의안 본문: 저작권 없음 (저작권법 제7조)
- 언론기사 인용: 공정이용 한도 준수
- 의원 SNS 사진: 저작권 확인 필요

### 이용약관 필수 문구
```
이 서비스의 정보는 참고용이며 정확성을 보증하지 않습니다.
법적 판단, 의사결정의 근거로 사용하지 마세요.
```

---

## 성능 목표

- 의원/법안 검색: 50ms 이하 (PostgreSQL FTS)
- 페이지 로드: LCP 2.5초 이하
- AI 요약: 사전생성이므로 즉시 로드
- 모바일: 반응형 웹 (앱 없음)

---

## 하지 않을 것 (MVP 범위 밖)

- 모바일 앱
- 로그인/회원가입
- 결제 시스템
- 댓글/커뮤니티
- 정치인 Q&A
- 실시간 본회의 스트리밍
- 스타트업 규제 내비게이터 (4개월차 이후)
