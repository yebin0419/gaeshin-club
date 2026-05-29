'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { User } from '@/types'

export default function AdminClient({ pendingUsers: initUsers }: { pendingUsers: User[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [users, setUsers] = useState(initUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const approve = async (u: User & { student_id_url?: string }) => {
    setLoading(u.id)
    await supabase.from('users').update({ status: 'approved' }).eq('id', u.id)
    // 이미지 삭제
    if (u.student_id_url) {
      const path = u.student_id_url.split('/student-ids/')[1]
      if (path) await supabase.storage.from('student-ids').remove([path])
    }
    await supabase.from('notifications').insert({
      user_id: u.id, type: 'approved', message: '학생증 인증이 승인되었습니다. 개신클럽에 오신 것을 환영합니다!', is_read: false,
    })
    setUsers(prev => prev.filter(x => x.id !== u.id))
    setLoading(null)
  }

  const reject = async (u: User & { student_id_url?: string }) => {
    setLoading(u.id)
    await supabase.from('users').update({ status: 'rejected' }).eq('id', u.id)
    if (u.student_id_url) {
      const path = u.student_id_url.split('/student-ids/')[1]
      if (path) await supabase.storage.from('student-ids').remove([path])
    }
    await supabase.from('notifications').insert({
      user_id: u.id, type: 'rejected', message: '학생증 인증이 거절되었습니다. 학번·이름·학과가 명확히 보이는 이미지로 재신청해 주세요.', is_read: false,
    })
    setUsers(prev => prev.filter(x => x.id !== u.id))
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#C0392B]">관리자 콘솔</h1>
            <p className="text-sm text-gray-500">학생증 인증 요청</p>
          </div>
          <Badge variant="primary" className="text-sm px-3 py-1">{users.length}건 대기</Badge>
        </div>

        {users.length === 0 ? (
          <div className="mt-20 text-center text-gray-400">
            <p className="text-lg">모든 인증 요청을 처리했습니다. ✓</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u: User & { student_id_url?: string }) => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.department} · {u.student_id}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                    <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('ko-KR')} 신청</p>
                  </div>
                  {u.student_id_url && (
                    <button onClick={() => setPreview(preview === u.id ? null : u.id)}
                      className="flex items-center gap-1 text-xs text-[#C0392B] border border-[#C0392B] rounded-lg px-2 py-1 hover:bg-[#FADBD8] transition-colors">
                      <Eye size={13} />학생증
                    </button>
                  )}
                </div>

                {preview === u.id && u.student_id_url && (
                  <img src={u.student_id_url} alt="학생증" className="w-full rounded-lg mb-3 max-h-48 object-cover" />
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
                    loading={loading === u.id} onClick={() => reject(u)}>
                    <X size={14} />거절
                  </Button>
                  <Button size="sm" className="flex-1" loading={loading === u.id} onClick={() => approve(u)}>
                    <Check size={14} />승인
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
