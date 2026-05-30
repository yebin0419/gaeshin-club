export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClubDetailClient from './ClubDetailClient'

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase.from('clubs').select('*').eq('id', id).single()
  if (!club) notFound()

  const { count: rawCount } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', id)

  // club_members RLS로 방장이 누락될 수 있으므로 방장 1명은 항상 보장
  const memberCount = (rawCount ?? 0) === 0 ? 1 : (rawCount ?? 0)

  // membership은 클라이언트에서 직접 조회 (브라우저 세션 사용)
  return <ClubDetailClient club={club} memberCount={memberCount} />
}
