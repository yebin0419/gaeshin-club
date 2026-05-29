'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

const roleLabel: Record<string, string> = { owner: '방장', staff: '임원진', member: '부원', alumni: '졸업/휴학' }
const roleBadge: Record<string, 'primary' | 'warning' | 'default' | 'outline'> = {
  owner: 'primary', staff: 'warning', member: 'default', alumni: 'outline',
}

interface Props {
  profile: { name: string; department: string; student_id: string; email: string; role: string } | null
  memberships: { role: string; club: { id: string; name: string; category: string } | null }[]
}

export default function ProfileClient({ profile, memberships }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24 pt-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">내 정보</h2>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#FADBD8] flex items-center justify-center">
              <User size={24} className="text-[#C0392B]" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile?.name}</p>
              <p className="text-sm text-gray-500">{profile?.department}</p>
              <p className="text-xs text-gray-400">{profile?.student_id} · {profile?.email}</p>
            </div>
          </div>
          {profile?.role === 'app_admin' && (
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')} className="w-full">
              관리자 콘솔
            </Button>
          )}
        </div>

        {/* 소속 동아리 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen size={16} />소속 동아리
          </h3>
          {memberships.length > 0 ? (
            <div className="flex flex-col gap-2">
              {memberships.map((m, i) => m.club && (
                <button key={i} onClick={() => router.push(`/clubs/${m.club!.id}`)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.club.name}</p>
                    <p className="text-xs text-gray-400">{m.club.category}</p>
                  </div>
                  <Badge variant={roleBadge[m.role] ?? 'default'}>{roleLabel[m.role] ?? m.role}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">소속된 동아리가 없습니다.</p>
          )}
        </div>

        <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50" onClick={handleLogout}>
          <LogOut size={16} />로그아웃
        </Button>
      </main>
      <BottomNav />
    </div>
  )
}
