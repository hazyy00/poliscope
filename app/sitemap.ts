import { createServerClient } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient()
  const base = 'https://poliscope.kr'

  const [membersRes, billsRes] = await Promise.all([
    supabase.from('members').select('id, updated_at'),
    supabase.from('bills').select('id, updated_at').eq('is_hidden', false),
  ])

  const memberUrls: MetadataRoute.Sitemap = (membersRes.data ?? []).map(m => ({
    url: `${base}/members/${m.id}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const billUrls: MetadataRoute.Sitemap = (billsRes.data ?? []).map(b => ({
    url: `${base}/bills/${b.id}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/members`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/bills`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/votes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...memberUrls,
    ...billUrls,
  ]
}
