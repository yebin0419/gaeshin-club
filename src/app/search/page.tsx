export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import SearchClient from './SearchClient'

export default async function SearchPage() {
  const supabase = await createClient()
  const { data: clubs } = await supabase.from('clubs').select('*').order('is_central', { ascending: false }).order('name')
  return <SearchClient allClubs={clubs ?? []} />
}
