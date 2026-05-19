import { createServerClient } from '@/lib/supabase'
import { LandingClient } from './LandingClient'

export default async function LandingPage() {
  const supabase = createServerClient()

  const [{ count: billsCount }, { count: membersCount }, { count: votesCount }] = await Promise.all([
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
  ])

  return (
    <LandingClient
      stats={{
        bills: billsCount ?? 0,
        members: membersCount ?? 0,
        votes: votesCount ?? 0,
      }}
    />
  )
}
