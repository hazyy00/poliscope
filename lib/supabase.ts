import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let browserClient: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(url, anonKey)
  }
  return browserClient
}

export function createServerClient() {
  return createClient(url, serviceKey ?? anonKey)
}
