export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClubDetailClient from './ClubDetailClient'

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase.from('clubs').select('*').eq('id', id).single()
  if (!club) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = user
    ? await supabase.from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).single()
    : { data: null }

  const { data: memberCount } = await supabase
    .from('club_members')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', id)

  return <ClubDetailClient club={club} membership={membership} memberCount={memberCount as unknown as number ?? 0} userId={user?.id} />
}
