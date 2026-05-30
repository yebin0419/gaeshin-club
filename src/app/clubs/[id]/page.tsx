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

  const { data: membership, error: membershipError } = user
    ? await supabase.from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).single()
    : { data: null, error: null }

  // [디버그] 서버 터미널에서 확인 — 값이 올바르면 { role: 'owner' } 가 찍혀야 함
  console.log('[ClubDetailPage] 현재 유저 ID:', user?.id ?? '로그인 안 됨')
  console.log('[ClubDetailPage] DB에서 가져온 내 권한:', membership)
  console.log('[ClubDetailPage] membership 쿼리 에러:', membershipError)

  const { count: memberCount } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', id)

  return <ClubDetailClient club={club} membership={membership} memberCount={memberCount ?? 0} userId={user?.id} />
}
