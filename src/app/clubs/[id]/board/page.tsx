import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BoardClient from './BoardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. 유저 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // 2. 동아리 정보 가져오기
  const { data: club } = await supabase.from('clubs').select('*').eq('id', id).single()
  if (!club) notFound()

  // 3. 게시글과 멤버 목록 동시에 가져오기 (방장님 기존 로직 완벽 복원)
  const [{ data: posts }, { data: members }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, content, type, is_pinned, created_at, author_id, author:users(name), comments(count), post_likes(count)')
      .eq('club_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('club_members')
      .select('user_id, role')
      .eq('club_id', id)
  ])

  // 4. 멤버 역할 맵핑 
  const roleMap: Record<string, string> = Object.fromEntries(
    (members ?? []).map(m => [m.user_id, m.role])
  )

  // 5. 게시글에 역할(role) 합치기
  const postsWithRole = (posts ?? []).map((p: any) => ({
    ...p,
    author_role: p.author_id ? (roleMap[p.author_id] ?? 'member') : null,
  }))

  // 6. 진짜 멤버인지 깐깐하게 확인하는 로직
  let isMember = false;
  if (userId) {
    if (club.owner_id === userId) {
      isMember = true; // 방장 통과
    } else if (members?.some(m => m.user_id === userId)) {
      isMember = true; // 일반 멤버 통과
    }
  }

  // 방장님의 원래 예쁜 UI 디자인 유지!
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href={`/clubs/${id}`} className="p-1 text-gray-500 hover:text-[#C0392B]">
              <ArrowLeft size={22} />
            </Link>
            <h1 className="font-bold text-lg text-gray-900">{club.name} 게시판</h1>
          </div>
        </div>
        
        {/* 모든 에러를 해결한 완벽한 데이터 전달! */}
        <BoardClient
          clubId={id}
          posts={postsWithRole as any}
          userId={userId}
          isMember={isMember}
        />
      </div>
    </div>
  )
}
