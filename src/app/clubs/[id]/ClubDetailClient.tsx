'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft, Loader2, X, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { Club } from '@/types'

const categoryEmoji: Record<string, string> = {
  교양: '🎨', 학술: '📚', 문화: '🎭', 봉사: '🤝', 체육: '⚽', 종교: '✝️',
}

const roleLabel: Record<string, string> = {
  owner: '방장', staff: '임원진', '총무': '총무', member: '일반 부원', alumni: '졸업/휴학',
}

interface ChatMember {
  user_id: string
  role: string
  user: { name: string } | null
}

interface Props {
  club: Club
  memberCount: number
}

export default function ClubDetailClient({ club, memberCount }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [showForm, setShowForm] = useState(false)
  const [contact, setContact] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [membership, setMembership] = useState<{ role: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isRecruiting, setIsRecruiting] = useState(club.is_recruiting)
  const [recruitingLoading, setRecruitingLoading] = useState(false)

  // 채팅 모달
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([])
  const [chatModalLoading, setChatModalLoading] = useState(false)
  const [dmLoading, setDmLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembership = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAuthLoading(false); return }

      setUserId(user.id)

      const [{ data: memberData }, { data: userData }] = await Promise.all([
        supabase.from('club_members').select('role').eq('club_id', club.id).eq('user_id', user.id).maybeSingle(),
        supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
      ])

      const ADMIN_ROLES = ['app_admin', 'admin']
      const isGlobalAdmin = ADMIN_ROLES.includes(userData?.role ?? '')

      if (isGlobalAdmin) {
        setMembership({ role: 'owner' })
      } else {
        setMembership(memberData)
      }
      setAuthLoading(false)
    }

    fetchMembership()
  }, [club.id])

  const handleApply = async () => {
    if (!contact) { setError('연락처를 입력해 주세요.'); return }
    if (!introduction) { setError('자기소개 및 지원동기를 입력해 주세요.'); return }
    setLoading(true)
    const { error: err } = await supabase.from('club_applications').insert({
      club_id: club.id, user_id: userId, contact, introduction, status: 'pending',
    })
    if (err) { setError('신청 중 오류가 발생했습니다.'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  const openChatModal = async () => {
    setShowChatModal(true)
    setChatModalLoading(true)
    const { data } = await supabase
      .from('club_members')
      .select('user_id, role, user:users(name)')
      .eq('club_id', club.id)
      .neq('user_id', userId ?? '')
    setChatMembers((data as ChatMember[]) ?? [])
    setChatModalLoading(false)
  }

  const openPersonalChat = async (targetUserId: string) => {
    if (!userId) return
    setDmLoading(targetUserId)

    // 기존 1:1 채팅방 탐색
    const { data: myParticipations } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', userId)

    const myRoomIds = (myParticipations ?? []).map(r => r.room_id)

    if (myRoomIds.length > 0) {
      const { data: shared } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', targetUserId)
        .in('room_id', myRoomIds)
        .maybeSingle()

      if (shared) {
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('id', shared.room_id)
          .eq('type', 'personal')
          .maybeSingle()

        if (room) {
          router.push(`/clubs/${club.id}/chat/${room.id}`)
          setDmLoading(null)
          return
        }
      }
    }

    // 새 방 생성
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ type: 'personal' })
      .select('id')
      .single()

    if (!newRoom) { setDmLoading(null); return }

    await supabase.from('chat_participants').insert([
      { room_id: newRoom.id, user_id: userId },
      { room_id: newRoom.id, user_id: targetUserId },
    ])

    router.push(`/clubs/${club.id}/chat/${newRoom.id}`)
    setDmLoading(null)
  }

  const isMember = !!membership
  const isOwner = membership?.role === 'owner'
  const isOwnerOrStaff = isOwner || membership?.role === 'staff'

  const handleToggleRecruiting = async () => {
    setRecruitingLoading(true)
    setError('')
    const next = !isRecruiting
    const { error, data } = await supabase
      .from('clubs')
      .update({ is_recruiting: next })
      .eq('id', club.id)
      .select()
    if (error) {
      setError(`모집 상태 변경 실패: ${error.message}`)
    } else if (!data || data.length === 0) {
      setError('권한 오류: 모집 상태를 변경할 수 없습니다. (RLS)')
    } else {
      setIsRecruiting(next)
      router.refresh()
    }
    setRecruitingLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    )
  }

  // 멤버/방장 공통 버튼 블록
  const memberButtons = (boardLabel: string, boardStyle: string) => (
    <>
      <div className="flex gap-2">
        <Button
          size="lg"
          className={`flex-1 ${boardStyle}`}
          onClick={() => router.push(`/clubs/${club.id}/board`)}
        >
          {boardLabel}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/clubs/${club.id}/finance`)}
        >
          회비 내역
        </Button>
      </div>
      <Button
        size="lg"
        variant="outline"
        className="w-full text-gray-600"
        onClick={() => router.push(`/clubs/${club.id}/chat`)}
      >
        공지방
      </Button>
      <button
        onClick={openChatModal}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
          bg-[#3C5A78] hover:bg-[#2d4460] text-white font-medium text-sm transition-colors"
      >
        <MessageSquare size={16} />
        채팅하기
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-4">
          <button
            onClick={() => { if (!recruitingLoading) window.location.href = '/home?refresh=' + new Date().getTime() }}
            disabled={recruitingLoading}
            className="p-1 text-gray-500 hover:text-[#C0392B] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-lg text-gray-900 truncate">{club.name}</h1>
        </div>

        {/* 동아리 정보 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="text-5xl mb-4 text-center">{categoryEmoji[club.category] ?? '🏫'}</div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">{club.name}</h2>
          <p className="text-sm text-gray-500 text-center mb-4">{club.category} 분과</p>

          <div className="flex justify-center gap-3 mb-4">
            <Badge variant={isRecruiting ? 'primary' : 'default'} className="text-sm px-3 py-1">
              {isRecruiting ? '모집 중' : '모집 마감'}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Users size={12} className="inline mr-1" />{memberCount}명
            </Badge>
          </div>

          {isOwner && (
            <div className="flex justify-center mb-2">
              <button
                onClick={handleToggleRecruiting}
                disabled={recruitingLoading}
                className={`text-xs font-medium px-4 py-1.5 rounded-full border transition-colors disabled:opacity-50
                  ${isRecruiting
                    ? 'border-gray-300 text-gray-500 hover:bg-gray-100'
                    : 'border-[#C0392B] text-[#C0392B] hover:bg-[#FADBD8]'}`}
              >
                {recruitingLoading
                  ? <><Loader2 size={12} className="inline mr-1 animate-spin" />변경 중...</>
                  : isRecruiting ? '모집 마감으로 변경' : '모집 중으로 변경'}
              </button>
            </div>
          )}

          {club.description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{club.description}</p>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2">
          {isOwner ? (
            memberButtons('게시판 입장', 'bg-[#C0392B] hover:bg-[#a93226] text-white')
          ) : isMember ? (
            memberButtons('게시판 보기', 'bg-[#C0392B] hover:bg-[#a93226] text-white')
          ) : isRecruiting ? (
            <>
              {!showForm && !success && (
                <Button size="lg" className="w-full" onClick={() => setShowForm(true)}>
                  가입 신청
                </Button>
              )}
              {showForm && !success && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
                  <h3 className="font-semibold text-gray-800">가입 신청</h3>
                  <Input label="연락처 (전화번호 또는 카카오ID)" value={contact} onChange={e => setContact(e.target.value)} placeholder="010-0000-0000" />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">자기소개 및 지원동기</label>
                    <textarea
                      value={introduction}
                      onChange={e => setIntroduction(e.target.value)}
                      placeholder="동아리에 지원하는 이유와 간단한 자기소개를 작성해 주세요."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-colors resize-none
                        focus:border-[#C0392B] focus:ring-2 focus:ring-[#FADBD8]"
                    />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>취소</Button>
                    <Button className="flex-1" loading={loading} onClick={handleApply}>신청하기</Button>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-[#FADBD8] rounded-xl p-4 text-center text-[#C0392B] text-sm font-medium">
                  ✓ 가입 신청이 완료되었습니다. 방장의 승인을 기다려 주세요.
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500 text-sm">
              현재 동아리 모집 기간이 아닙니다.
            </div>
          )}

          {isMember && !isOwnerOrStaff && (
            <Button variant="outline" className="w-full text-gray-600" onClick={() => router.push(`/clubs/${club.id}/members`)}>
              멤버 목록
            </Button>
          )}
          {isOwnerOrStaff && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => router.push(`/clubs/${club.id}/members`)}>
                멤버 관리
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push(`/clubs/${club.id}/finance`)}>
                회비 관리
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 멤버 선택 모달 */}
      {showChatModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => setShowChatModal(false)}
        >
          <div
            className="bg-white w-full max-w-2xl mx-auto rounded-t-2xl max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">채팅할 멤버 선택</h3>
              <button onClick={() => setShowChatModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-3 py-2">
              {chatModalLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-gray-300" />
                </div>
              ) : chatMembers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-10">다른 멤버가 없습니다.</p>
              ) : (
                chatMembers.map(m => (
                  <button
                    key={m.user_id}
                    onClick={() => openPersonalChat(m.user_id)}
                    disabled={!!dmLoading}
                    className="w-full flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#3C5A78]/10 flex items-center justify-center text-[#3C5A78] font-semibold text-sm flex-shrink-0">
                      {m.user?.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{m.user?.name}</p>
                      <p className="text-xs text-gray-400">{roleLabel[m.role] ?? m.role}</p>
                    </div>
                    {dmLoading === m.user_id && (
                      <Loader2 size={16} className="animate-spin text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
