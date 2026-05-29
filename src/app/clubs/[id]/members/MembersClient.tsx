'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'

interface Application {
  id: string
  user_id: string
  contact: string
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

const roleLabel: Record<string, string> = { owner: '방장', staff: '임원진', member: '일반 부원', alumni: '졸업/휴학' }
const roleBadge: Record<string, 'primary' | 'warning' | 'default' | 'outline'> = {
  owner: 'primary', staff: 'warning', member: 'default', alumni: 'outline',
}

export default function MembersClient({ clubId, clubName, applications: initApps, members, myRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [applications, setApplications] = useState(initApps)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)

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
    router.refresh()
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
          <h2 className="text-sm font-semibold text-gray-700 mb-2">전체 멤버 ({members.length})</h2>
          <div className="flex flex-col gap-2">
            {members.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{m.user?.name}</p>
                  <p className="text-xs text-gray-400">{m.user?.department} · {m.user?.student_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={roleBadge[m.role] ?? 'default'}>{roleLabel[m.role] ?? m.role}</Badge>
                  {myRole === 'owner' && m.role !== 'owner' && (
                    <select
                      value={m.role}
                      onChange={e => changeRole(m.id, m.user_id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="staff">임원진</option>
                      <option value="member">일반 부원</option>
                      <option value="alumni">졸업/휴학</option>
                    </select>
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
