// LIKMS 의안정보시스템 스크래핑
// 1단계: billDetailPage.do GET → 세션 쿠키 + CSRF + 폼 파라미터 추출
// 2단계: /bi/bill/detail/billInfo.do POST → 제안이유 및 주요내용 HTML 프래그먼트 수신

const DETAIL_PAGE_BASE = 'https://likms.assembly.go.kr/bill/bi/billDetailPage.do'
const BILL_INFO_AJAX   = 'https://likms.assembly.go.kr/bill/bi/bill/detail/billInfo.do'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

function extractBetween(html: string, open: string, close: string): string | null {
  const start = html.indexOf(open)
  if (start === -1) return null
  const end = html.indexOf(close, start + open.length)
  if (end === -1) return null
  return html.slice(start + open.length, end)
}

function extractFormParams(html: string): Record<string, string> {
  const formMatch = extractBetween(html, '<form id="form"', '</form>')
  if (!formMatch) return {}
  const params: Record<string, string> = {}
  // match both name-before-value and value-before-name attribute orderings
  for (const m of formMatch.matchAll(/<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"[^>]*>/gi)) {
    params[m[1]] = m[2]
  }
  return params
}

export async function scrapeBillText(billId: string, _contentUrl: string | null): Promise<string | null> {
  try {
    // 1단계: 상세 페이지 GET → 세션 쿠키 + CSRF + 폼 파라미터
    const pageUrl = `${DETAIL_PAGE_BASE}?billId=${encodeURIComponent(billId)}&currMenuNo=2600044`
    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
    })
    if (!pageRes.ok) return null

    const pageHtml = await pageRes.text()

    const csrf = extractBetween(pageHtml, '<meta name="_csrf" content="', '">')
    if (!csrf) return null

    // 세션 쿠키 (Node.js fetch는 자동 쿠키 관리 안 함 → 수동 추출)
    const cookieHeader = pageRes.headers.getSetCookie?.()
      .map(c => c.split(';')[0])
      .join('; ') ?? pageRes.headers.get('set-cookie')?.split(';')[0] ?? ''

    // 제안이유 렌더링에 필요한 모든 폼 파라미터
    const params = extractFormParams(pageHtml)
    params['currMenuNo'] = '2600044'

    if (!params['billId']) params['billId'] = billId

    // 2단계: AJAX POST → billInfo 프래그먼트 수신
    const body = new URLSearchParams(params)
    const ajaxRes = await fetch(BILL_INFO_AJAX, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrf,
        'Referer': pageUrl,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: body.toString(),
    })
    if (!ajaxRes.ok) return null

    const ajaxHtml = await ajaxRes.text()

    // <pre id="prntSummary"> 안의 텍스트 추출
    const raw = extractBetween(ajaxHtml, 'id="prntSummary"', '</pre>')
    if (!raw) return null

    const text = raw
      .replace(/^[^>]*>/, '')            // 첫 번째 > 까지 (style 속성 등) 제거
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()

    return text.length >= 100 ? text.slice(0, 4000) : null
  } catch {
    return null
  }
}
