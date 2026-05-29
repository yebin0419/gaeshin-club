'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft } from 'lucide-react'
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
  membership: { role: string } | null
  memberCount: number
  userId?: string
}

export default function ClubDetailClient({ club, membership, memberCount, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [applying, setApplying] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
  const isOwnerOrStaff = membership?.role === 'owner' || membership?.role === 'staff'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-4">
          <button onClick={() => router.back()} className="p-1 text-gray-500 hover:text-[#C0392B]">
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
            <Badge variant={club.is_recruiting ? 'primary' : 'default'} className="text-sm px-3 py-1">
              {club.is_recruiting ? '모집 중' : '모집 마감'}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Users size={12} className="inline mr-1" />{memberCount}명
            </Badge>
          </div>

          {club.description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{club.description}</p>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2">
          {isMember ? (
            <Button size="lg" className="w-full" onClick={() => router.push(`/clubs/${club.id}/board`)}>
              게시판 보기
            </Button>
          ) : (
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
