export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MembersClient from './MembersClient'

const ADMIN_ROLES = ['app_admin', 'admin', 'owner']

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: myMembership }, { data: userData }] = await Promise.all([
    supabase.from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).single(),
    supabase.from('users').select('role').eq('id', user.id).single(),
  ])

  const isGlobalAdmin = ADMIN_ROLES.includes(userData?.role ?? '')

  // 전역 관리자가 아니면서 staff/owner도 아니면 접근 차단
  if (!isGlobalAdmin && (!myMembership || (myMembership.role !== 'owner' && myMembership.role !== 'staff'))) {
    redirect(`/clubs/${id}`)
  }

  const { data: club } = await supabase.from('clubs').select('name').eq('id', id).single()
  if (!club) notFound()

  const { data: applications } = await supabase
    .from('club_applications')
    .select('*, user:users(name, department, student_id)')
    .eq('club_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // 1단계: 조인 없이 순수 club_members 데이터만 먼저 확인
  const { data: rawMembers, error: rawError } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_id', id)
    .order('joined_at', { ascending: false })

  console.log('[MembersPage] club_id:', id)
  console.log('[MembersPage] user.id:', user.id)
  console.log('[MembersPage] myMembership:', myMembership)
  console.log('[MembersPage] isGlobalAdmin:', isGlobalAdmin)
  console.log('[MembersPage] rawMembers (조인 없이):', rawMembers?.length, '명 / error:', rawError?.message)
  console.log('[MembersPage] rawMembers 데이터:', JSON.stringify(rawMembers))

  // 2단계: users 조인 포함 쿼리
  const { data: members, error: membersError } = await supabase
    .from('club_members')
    .select('*, user:users(name, department, student_id)')
    .eq('club_id', id)
    .order('joined_at', { ascending: false })

  console.log('[MembersPage] members (조인 포함):', members?.length, '명 / error:', membersError?.message)

  // 전역 관리자는 myRole을 'owner'로 강제
  const myRole = isGlobalAdmin ? 'owner' : (myMembership?.role ?? 'member')

  return (
    <MembersClient
      clubId={id}
      clubName={club.name}
      applications={applications ?? []}
      members={members ?? []}
      myRole={myRole}
    />
  )
}
