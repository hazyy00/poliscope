export interface Member {
  id: string
  name: string
  name_en: string | null
  party: string | null
  district: string | null
  is_pr: boolean
  committee: string[] | null
  photo_url: string | null
  term: number
  birth_date: string | null
  gender: string | null
  career: CareerEntry[]
  assets: Record<string, unknown> | null
  sns: Record<string, string>
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
}

export interface CareerEntry {
  title: string
  period?: string
}

export interface Bill {
  id: string
  title: string
  status: '계류' | '가결' | '부결' | '폐기' | '철회' | '수정가결'
  committee: string | null
  proposer_id: string | null
  proposed_at: string | null
  passed_at: string | null
  content_url: string | null
  summary_short: string | null
  ai_summary: AiSummaryJson | null
  ai_summary_at: string | null
  ai_confidence: number | null
  report_count: number
  is_hidden: boolean
  created_at: string
  updated_at: string
}

export interface AiSummaryJson {
  summary: string
  key_points: string[]
  personas: {
    worker: string
    selfemployed: string
    student: string
  }
  confidence: number
}

export interface Vote {
  id: string
  bill_id: string | null
  title: string
  voted_at: string | null
  result: '가결' | '부결' | '폐기' | '무효' | null
  yes_count: number
  no_count: number
  abstain_count: number
  absent_count: number
  created_at: string
}

export interface MemberVote {
  vote_id: string
  member_id: string
  stance: '찬성' | '반대' | '기권' | '불참'
}

export interface Attendance {
  id: number
  member_id: string
  session: string
  date: string
  attended: boolean
}

export interface PageResult<T> {
  data: T[]
  count: number
}
