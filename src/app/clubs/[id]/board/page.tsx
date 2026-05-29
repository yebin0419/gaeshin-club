export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pin, BarChart2, Plus } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Post } from '@/types'

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase.from('clubs').select('name').eq('id', id).single()
  if (!club) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = user
    ? await supabase.from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).single()
    : { data: null }

  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:users(name)')
    .eq('club_id', id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const isStaff = membership?.role === 'owner' || membership?.role === 'staff'

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
          {membership && (
            <Link href={`/clubs/${id}/board/write`}
              className="flex items-center gap-1 text-sm text-[#C0392B] font-medium hover:bg-[#FADBD8] px-2 py-1 rounded-lg">
              <Plus size={16} />글쓰기
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {posts && posts.length > 0 ? (
            posts.map((post: Post & { author?: { name: string } }) => (
              <Link key={post.id} href={`/clubs/${id}/board/${post.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#C0392B]/30 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  {post.is_pinned && <Pin size={13} className="text-[#C0392B]" />}
                  {post.type === 'notice' && <Badge variant="primary">공지</Badge>}
                  {post.type === 'poll' && <Badge variant="warning"><BarChart2 size={11} className="inline mr-0.5" />수요조사</Badge>}
                  {post.type === 'general' && <Badge variant="default">일반</Badge>}
                </div>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{post.title}</h3>
                <p className="text-xs text-gray-400 mt-1.5">{post.author?.name ?? '알 수 없음'} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
              </Link>
            ))
          ) : (
            <div className="mt-16 text-center text-gray-400 text-sm">게시글이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}
