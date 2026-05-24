export async function scrapeBillText(contentUrl: string): Promise<string | null> {
  try {
    const res = await fetch(contentUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PoliScope/1.0)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null

    const html = await res.text()

    // Strip tags
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()

    // 1순위: 제안이유 및 주요내용 섹션
    const combined = text.match(/제안이유\s*및\s*주요내용\s+([\s\S]{200,6000}?)(?=붙임|참고사항|별표|$)/)
    if (combined) return combined[1].trim().slice(0, 4000)

    // 2순위: 제안이유 섹션
    const reason = text.match(/제안이유\s+([\s\S]{100,4000}?)(?=주요내용|붙임|참고|$)/)
    // 3순위: 주요내용 섹션
    const main = text.match(/주요내용\s+([\s\S]{100,3000}?)(?=붙임|참고|별표|$)/)

    const extracted = [reason?.[1], main?.[1]].filter(Boolean).join('\n\n').trim()
    if (extracted.length > 100) return extracted.slice(0, 4000)

    return null
  } catch {
    return null
  }
}
