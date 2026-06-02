export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MembersClient from './MembersClient'

const ADMIN_ROLES = ['app_admin', 'admin']

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

  // 멤버가 아니면 접근 불가 (비회원·대기자 차단)
  if (!isGlobalAdmin && !myMembership) redirect(`/clubs/${id}`)

  const canManage = isGlobalAdmin ||
    myMembership?.role === 'owner' ||
    myMembership?.role === 'staff'

  const { data: club } = await supabase
    .from('clubs')
    .select('name, created_by')
    .eq('id', id)
    .single()
  if (!club) notFound()

  const { data: applications } = await supabase
    .from('club_applications')
    .select('*, user:users(name, department, student_id)')
    .eq('club_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: rawMembers } = await supabase
    .from('club_members')
    .select('*, user:users(name, department, student_id)')
    .eq('club_id', id)
    .order('joined_at', { ascending: false })

  // 방장이 club_members에 없을 때 수동으로 앞에 삽입
  const ownerInList = (rawMembers ?? []).some(m => m.user_id === club.created_by)
  let members = rawMembers ?? []

  if (!ownerInList && club.created_by) {
    const { data: ownerUser } = await supabase
      .from('users')
      .select('name, department, student_id')
      .eq('id', club.created_by)
      .single()

    members = [
      {
        id: 'owner-synthetic',
        user_id: club.created_by,
        role: 'owner',
        joined_at: new Date().toISOString(),
        user: ownerUser ?? undefined,
      },
      ...members,
    ]
  }

  const myRole = isGlobalAdmin ? 'owner' : (myMembership?.role ?? 'member')

  return (
    <MembersClient
      clubId={id}
      clubName={club.name}
      applications={applications ?? []}
      members={members}
      myRole={myRole}
      canManage={canManage}
    />
  )
}
