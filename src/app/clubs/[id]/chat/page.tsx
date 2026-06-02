export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ChatRoom from '@/components/chat/ChatRoom'

const ADMIN_ROLES = ['app_admin', 'admin']

export default async function AnnouncementChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: membership }, { data: userData }, { data: club }] = await Promise.all([
    supabase.from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.from('clubs').select('name').eq('id', id).single(),
  ])

  if (!club) notFound()

  const isGlobalAdmin = ADMIN_ROLES.includes(userData?.role ?? '')

  // 멤버가 아니면 접근 불가
  if (!isGlobalAdmin && !membership) redirect(`/clubs/${id}`)

  const role = membership?.role ?? ''
  const canSend = isGlobalAdmin || role === 'owner' || role === 'staff' || role === '총무'

  // 공지방이 없으면 생성
  let { data: room } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('club_id', id)
    .eq('type', 'announcement')
    .maybeSingle()

  if (!room) {
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ type: 'announcement', club_id: id })
      .select('id')
      .single()
    room = newRoom
  }

  if (!room) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users(name)')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true })

  return (
    <ChatRoom
      roomId={room.id}
      title={`${club.name} 공지방`}
      currentUserId={user.id}
      messages={messages ?? []}
      canSend={canSend}
      backHref={`/clubs/${id}`}
    />
  )
}
