'use client'

import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function PendingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'PENDING' | 'REJECTED'>('PENDING')

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('verification_status').eq('id', user.id).single()
      if (data?.verification_status === 'REJECTED') setStatus('REJECTED')
    }
    checkStatus()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {status === 'PENDING' ? (
          <>
            <div className="w-16 h-16 bg-[#FADBD8] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-[#C0392B]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">승인 대기 중</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              학생증 인증을 검토하고 있습니다.<br />
              관리자 승인 후 서비스를 이용할 수 있습니다.<br />
              보통 1~2 영업일 내에 처리됩니다.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">가입 거절</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              학생증 인증이 거절되었습니다.<br />
              학번, 이름, 학과가 명확히 보이는<br />
              학생증 이미지로 다시 신청해 주세요.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {status === 'REJECTED' && (
            <Button onClick={() => router.push('/signup')} className="w-full">
              재신청하기
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout} className="w-full">
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
