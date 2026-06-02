export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ChatRoom from '@/components/chat/ChatRoom'

export default async function PersonalChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 참여자인지 확인
  const { data: myMembership } = await supabase
    .from('chat_participants')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMembership) redirect('/home')

  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id, type')
    .eq('id', roomId)
    .eq('type', 'personal')
    .maybeSingle()

  if (!room) notFound()

  // 상대방 이름 조회 (채팅방 제목용)
  const { data: other } = await supabase
    .from('chat_participants')
    .select('user:users(name)')
    .eq('room_id', roomId)
    .neq('user_id', user.id)
    .maybeSingle()

  const u = other?.user as unknown
  const otherName = (Array.isArray(u) ? (u[0] as { name: string })?.name : (u as { name: string } | null)?.name) ?? '대화 상대'

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users(name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  return (
    <ChatRoom
      roomId={roomId}
      title={otherName}
      currentUserId={user.id}
      messages={messages ?? []}
      canSend={true}
      backHref="/home"
    />
  )
}
