'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { Club } from '@/types'

const categoryEmoji: Record<string, string> = {
  교양: '🎨', 학술: '📚', 문화: '🎭', 봉사: '🤝', 체육: '⚽', 종교: '✝️',
}

interface Props {
  club: Club
  memberCount: number
}

export default function ClubDetailClient({ club, memberCount }: Props) {
  const router = useRouter()
  // useMemo로 컴포넌트 생애주기 동안 단 한 번만 생성
  const supabase = useMemo(() => createClient(), [])
  const [showForm, setShowForm] = useState(false)
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [membership, setMembership] = useState<{ role: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isRecruiting, setIsRecruiting] = useState(club.is_recruiting)
  const [recruitingLoading, setRecruitingLoading] = useState(false)

  useEffect(() => {
    const fetchMembership = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAuthLoading(false); return }

      setUserId(user.id)

      const [{ data: memberData }, { data: userData }] = await Promise.all([
        supabase
          .from('club_members')
          .select('role')
          .eq('club_id', club.id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      const ADMIN_ROLES = ['app_admin', 'admin', 'owner']
      const isGlobalAdmin = ADMIN_ROLES.includes(userData?.role ?? '')

      console.log('[권한체크] user.id:', user.id)
      console.log('[권한체크] users.role (DB값):', userData?.role)
      console.log('[권한체크] club_members 조회 결과:', memberData)
      console.log('[권한체크] isGlobalAdmin:', isGlobalAdmin)

      // 전역 관리자이면 무조건 owner로 간주
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
    setLoading(true)
    const { error: err } = await supabase.from('club_applications').insert({
      club_id: club.id, user_id: userId, contact, status: 'pending',
    })
    if (err) { setError('신청 중 오류가 발생했습니다.'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  const isMember = !!membership
  const isOwner = membership?.role === 'owner'
  const isOwnerOrStaff = isOwner || membership?.role === 'staff'

  const handleToggleRecruiting = async () => {
    setRecruitingLoading(true)
    setError('')
    const next = !isRecruiting
    console.log('[토글] club.id:', club.id, '변경할 값:', next)
    const { error, data } = await supabase
      .from('clubs')
      .update({ is_recruiting: next })
      .eq('id', club.id)
      .select()
    console.log('[토글] 결과 data:', data, 'error:', error)
    if (error) {
      console.error('DB 업데이트 에러:', error)
      setError(`모집 상태 변경 실패: ${error.message}`)
    } else if (!data || data.length === 0) {
      console.error('DB 업데이트 에러: RLS 정책에 의해 차단됨 (0 rows updated)')
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
            <Button
              size="lg"
              className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white"
              onClick={() => router.push(`/clubs/${club.id}/board`)}
            >
              게시판 입장
            </Button>
          ) : isMember ? (
            <Button size="lg" className="w-full" onClick={() => router.push(`/clubs/${club.id}/board`)}>
              게시판 보기
            </Button>
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
    </div>
  )
}
