// 국회 의안정보시스템(LIKMS)과 PAL은 완전 클라이언트 렌더링이라
// 서버사이드 정적 스크래핑으로 제안이유/주요내용 본문을 가져올 수 없음.
// 현재는 신뢰할 수 있는 원문 소스가 없는 상태.
// TODO: 법안 원문 제공 API 또는 HWP/PDF 다운로드 경로 확인 필요.

export async function scrapeBillText(_billId: string, _contentUrl: string | null): Promise<string | null> {
  return null
}
