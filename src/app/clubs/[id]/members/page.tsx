export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MembersClient from './MembersClient'

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myMembership } = await supabase
    .from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).single()

  if (!myMembership || (myMembership.role !== 'owner' && myMembership.role !== 'staff')) {
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

  const { data: members } = await supabase
    .from('club_members')
    .select('*, user:users(name, department, student_id)')
    .eq('club_id', id)
    .order('joined_at', { ascending: false })

  return (
    <MembersClient
      clubId={id}
      clubName={club.name}
      applications={applications ?? []}
      members={members ?? []}
      myRole={myMembership.role}
    />
  )
}
