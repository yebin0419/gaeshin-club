'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'

interface Application {
  id: string
  user_id: string
  contact: string
  introduction?: string
  created_at: string
  user?: { name: string; department: string; student_id: string }
}

interface Member {
  id: string
  user_id: string
  role: string
  joined_at: string
  user?: { name: string; department: string; student_id: string }
}

interface Props {
  clubId: string
  clubName: string
  applications: Application[]
  members: Member[]
  myRole: string
}

const roleLabel: Record<string, string> = { owner: '방장', staff: '임원진', '총무': '총무', member: '일반 부원', alumni: '졸업/휴학' }
const roleBadge: Record<string, 'primary' | 'warning' | 'default' | 'outline'> = {
  owner: 'primary', staff: 'warning', '총무': 'warning', member: 'default', alumni: 'outline',
}

export default function MembersClient({ clubId, clubName, applications: initApps, members: initMembers, myRole }: Props) {
  console.log('DB에서 막 퍼온 멤버 데이터:', initMembers)
  console.log('에러가 있다면: (서버에서 처리됨, 에러 시 빈 배열 전달)')
  console.log('myRole:', myRole, '/ isOwner:', myRole === 'owner')
  console.log('가입 신청 목록:', initApps)

  const router = useRouter()
  const supabase = createClient()
  const [applications, setApplications] = useState(initApps)
  const [memberList, setMemberList] = useState(initMembers)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [dmLoading, setDmLoading] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const startPersonalChat = async (targetUserId: string) => {
    if (!currentUserId) return
    setDmLoading(targetUserId)

    // 기존 1:1 채팅방 탐색
    const { data: myRooms } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', currentUserId)

    const myRoomIds = (myRooms ?? []).map(r => r.room_id)

    if (myRoomIds.length > 0) {
      const { data: shared } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', targetUserId)
        .in('room_id', myRoomIds)
        .maybeSingle()

      if (shared) {
        const { data: roomData } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('id', shared.room_id)
          .eq('type', 'personal')
          .maybeSingle()

        if (roomData) {
          router.push(`/chat/${roomData.id}`)
          setDmLoading(null)
          return
        }
      }
    }

    // 없으면 새 1:1 채팅방 생성
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ type: 'personal' })
      .select('id')
      .single()

    if (!newRoom) { setDmLoading(null); return }

    await supabase.from('chat_room_members').insert([
      { room_id: newRoom.id, user_id: currentUserId },
      { room_id: newRoom.id, user_id: targetUserId },
    ])

    router.push(`/chat/${newRoom.id}`)
    setDmLoading(null)
  }

  const approve = async (app: Application) => {
    setLoading(app.id)
    await supabase.from('club_applications').update({ status: 'approved' }).eq('id', app.id)
    await supabase.from('club_members').insert({ club_id: clubId, user_id: app.user_id, role: 'member' })
    await supabase.from('notifications').insert({ user_id: app.user_id, type: 'join_approved', message: `${clubName} 가입이 승인되었습니다.`, is_read: false })
    setApplications(prev => prev.filter(a => a.id !== app.id))
    setLoading(null)
    router.refresh()
  }

  const reject = async (app: Application) => {
    setLoading(app.id)
    const reason = rejectReason[app.id] || ''
    await supabase.from('club_applications').update({ status: 'rejected', reject_reason: reason }).eq('id', app.id)
    await supabase.from('notifications').insert({ user_id: app.user_id, type: 'join_rejected', message: `${clubName} 가입이 거절되었습니다.${reason ? ' 사유: ' + reason : ''}`, is_read: false })
    setApplications(prev => prev.filter(a => a.id !== app.id))
    setLoading(null)
  }

  const changeRole = async (memberId: string, userId: string, newRole: string) => {
    await supabase.from('club_members').update({ role: newRole }).eq('id', memberId)
    setMemberList(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
  }

  const removeMember = async (memberId: string, name: string) => {
    if (!window.confirm(`정말 '${name}' 멤버를 내보내시겠습니까?`)) return
    const { error } = await supabase.from('club_members').delete().eq('id', memberId)
    if (error) { alert(`삭제 중 오류가 발생했습니다.\n${error.message}`); return }
    setMemberList(prev => prev.filter(m => m.id !== memberId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-4">
          <button onClick={() => router.back()} className="p-1 text-gray-500"><ArrowLeft size={22} /></button>
          <h1 className="font-bold text-lg">{clubName} 멤버 관리</h1>
        </div>

        {/* 가입 신청 목록 */}
        {applications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">가입 신청 ({applications.length})</h2>
            <div className="flex flex-col gap-2">
              {applications.map(app => (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{app.user?.name}</p>
                      <p className="text-xs text-gray-400">{app.user?.department} · {app.user?.student_id}</p>
                      <p className="text-xs text-gray-400">연락처: {app.contact}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(app.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  {app.introduction && (
                    <div className="mb-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">자기소개 및 지원동기</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{app.introduction}</p>
                    </div>
                  )}
                  <div className="flex gap-1 mb-2">
                    <Input
                      value={rejectReason[app.id] ?? ''}
                      onChange={e => setRejectReason(prev => ({ ...prev, [app.id]: e.target.value }))}
                      placeholder="거절 사유 (선택)"
                      className="text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 border-red-300 text-red-500"
                      loading={loading === app.id} onClick={() => reject(app)}>
                      <X size={14} />거절
                    </Button>
                    <Button size="sm" className="flex-1" loading={loading === app.id} onClick={() => approve(app)}>
                      <Check size={14} />승인
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 현재 멤버 목록 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">전체 멤버 ({memberList.length})</h2>
          <div className="flex flex-col gap-2">
            {memberList.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{m.user?.name}</p>
                  <p className="text-xs text-gray-400">{m.user?.department} · {m.user?.student_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={roleBadge[m.role] ?? 'default'}>{roleLabel[m.role] ?? m.role}</Badge>
                  {m.user_id !== currentUserId && (
                    <button
                      onClick={() => startPersonalChat(m.user_id)}
                      disabled={dmLoading === m.user_id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#C0392B] hover:bg-[#FADBD8] transition-colors disabled:opacity-40"
                      title="1:1 메시지"
                    >
                      <MessageCircle size={16} />
                    </button>
                  )}
                  {myRole === 'owner' && m.user_id !== currentUserId && m.role !== 'owner' && (
                    <>
                      <select
                        value={m.role}
                        onChange={e => changeRole(m.id, m.user_id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#C0392B]"
                      >
                        <option value="staff">임원진</option>
                        <option value="총무">총무</option>
                        <option value="member">일반 부원</option>
                        <option value="alumni">졸업/휴학</option>
                      </select>
                      <button
                        onClick={() => removeMember(m.id, m.user?.name ?? '멤버')}
                        className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors px-1"
                      >
                        내보내기
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
