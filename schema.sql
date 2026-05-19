-- PoliScope Supabase 스키마
-- Supabase SQL Editor에서 순서대로 실행

-- pgvector 확장
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 의원 ──────────────────────────────────────────────────
CREATE TABLE members (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  name_en         TEXT,
  party           TEXT,
  district        TEXT,
  is_pr           BOOLEAN DEFAULT FALSE,
  committee       TEXT[],
  photo_url       TEXT,
  term            INTEGER DEFAULT 22,
  birth_date      DATE,
  gender          TEXT,
  career          JSONB DEFAULT '[]',
  assets          JSONB,
  contact_email   TEXT,
  contact_phone   TEXT,
  sns             JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_party    ON members(party);
CREATE INDEX idx_members_district ON members(district);
CREATE INDEX idx_members_name     ON members USING gin(to_tsvector('simple', name));

-- ── 법안 ──────────────────────────────────────────────────
CREATE TABLE bills (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  status          TEXT CHECK (status IN ('계류','가결','부결','폐기','철회','수정가결')),
  committee       TEXT,
  proposer_id     TEXT REFERENCES members(id) ON DELETE SET NULL,
  proposed_at     DATE,
  passed_at       DATE,
  content_url     TEXT,
  summary_short   TEXT,                    -- 원문 3줄 요약
  ai_summary      TEXT,                    -- AI 요약 JSON
  ai_summary_at   TIMESTAMPTZ,
  ai_confidence   NUMERIC(3,2),            -- 0.00~1.00
  report_count    INTEGER DEFAULT 0,       -- 사용자 신고 수
  is_hidden       BOOLEAN DEFAULT FALSE,   -- 신고 5건 이상 자동 숨김
  embedding       vector(1536),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bills_status     ON bills(status);
CREATE INDEX idx_bills_committee  ON bills(committee);
CREATE INDEX idx_bills_proposed   ON bills(proposed_at DESC);
CREATE INDEX idx_bills_title      ON bills USING gin(to_tsvector('simple', title));
CREATE INDEX idx_bills_embedding  ON bills USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);

-- 공동발의자
CREATE TABLE bill_cosponsors (
  bill_id     TEXT REFERENCES bills(id) ON DELETE CASCADE,
  member_id   TEXT REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (bill_id, member_id)
);

-- ── 표결 ──────────────────────────────────────────────────
CREATE TABLE votes (
  id              TEXT PRIMARY KEY,
  bill_id         TEXT REFERENCES bills(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  voted_at        TIMESTAMPTZ,
  result          TEXT CHECK (result IN ('가결','부결','폐기','무효')),
  yes_count       INTEGER DEFAULT 0,
  no_count        INTEGER DEFAULT 0,
  abstain_count   INTEGER DEFAULT 0,
  absent_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_votes_voted_at ON votes(voted_at DESC);
CREATE INDEX idx_votes_result   ON votes(result);

-- 개별 의원 표결
CREATE TABLE member_votes (
  vote_id     TEXT REFERENCES votes(id) ON DELETE CASCADE,
  member_id   TEXT REFERENCES members(id) ON DELETE CASCADE,
  stance      TEXT CHECK (stance IN ('찬성','반대','기권','불참')),
  PRIMARY KEY (vote_id, member_id)
);

CREATE INDEX idx_member_votes_member ON member_votes(member_id);

-- ── 출석 ──────────────────────────────────────────────────
CREATE TABLE attendance (
  id          BIGSERIAL PRIMARY KEY,
  member_id   TEXT REFERENCES members(id) ON DELETE CASCADE,
  session     TEXT,                        -- 회기
  date        DATE,
  attended    BOOLEAN,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (member_id, date)
);

CREATE INDEX idx_attendance_member ON attendance(member_id);

-- ── 이메일 구독 ───────────────────────────────────────────
CREATE TABLE subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI 요약 신고 ──────────────────────────────────────────
CREATE TABLE bill_reports (
  id          BIGSERIAL PRIMARY KEY,
  bill_id     TEXT REFERENCES bills(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 신고 5건 이상 자동 숨김 트리거
CREATE OR REPLACE FUNCTION check_bill_reports()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bills 
  SET is_hidden = TRUE
  WHERE id = NEW.bill_id
    AND (SELECT COUNT(*) FROM bill_reports WHERE bill_id = NEW.bill_id) >= 5;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_hide_reported_bill
AFTER INSERT ON bill_reports
FOR EACH ROW EXECUTE FUNCTION check_bill_reports();

-- ── updated_at 자동 갱신 ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_members_updated BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bills_updated   BEFORE UPDATE ON bills   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS (Row Level Security) ──────────────────────────────
-- 읽기는 전체 공개, 쓰기는 서비스 롤만
ALTER TABLE members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read members"      ON members      FOR SELECT USING (true);
CREATE POLICY "public read bills"        ON bills        FOR SELECT USING (NOT is_hidden);
CREATE POLICY "public read votes"        ON votes        FOR SELECT USING (true);
CREATE POLICY "public read member_votes" ON member_votes FOR SELECT USING (true);

-- ── 나머지 테이블 RLS ─────────────────────────────────────────
-- attendance: 공개 읽기 허용 (개인정보 없음)
ALTER TABLE attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_cosponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read attendance"       ON attendance       FOR SELECT USING (true);
CREATE POLICY "public read bill_cosponsors"  ON bill_cosponsors  FOR SELECT USING (true);

-- subscribers: 공개 읽기 금지 (이메일 주소 보호)
-- bill_reports: 공개 읽기 금지 (신고 내역 보호)
ALTER TABLE subscribers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reports ENABLE ROW LEVEL SECURITY;
-- SELECT 정책 없음 = anon 키로 조회 불가, 서비스 롤만 접근 가능
