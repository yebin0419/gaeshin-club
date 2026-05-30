export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pin, BarChart2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Post } from '@/types'

type PostWithAuthor = Post & { author: { name: string } | null }

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>
}) {
  const { id, postId } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*, author:users(name)')
    .eq('id', postId)
    .eq('club_id', id)
    .single<PostWithAuthor>()

  if (!post) notFound()

  const typeLabel: Record<string, string> = { notice: '공지', general: '일반', poll: '수요조사' }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-4">
          <Link href={`/clubs/${id}/board`} className="p-1 text-gray-500 hover:text-[#C0392B]">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-bold text-lg text-gray-900 truncate">게시글</h1>
        </div>

        {/* 본문 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          {/* 배지 */}
          <div className="flex items-center gap-2 mb-3">
            {post.is_pinned && <Pin size={13} className="text-[#C0392B]" />}
            {post.type === 'notice' && <Badge variant="primary">{typeLabel.notice}</Badge>}
            {post.type === 'poll'   && <Badge variant="warning"><BarChart2 size={11} className="inline mr-0.5" />{typeLabel.poll}</Badge>}
            {post.type === 'general' && <Badge variant="default">{typeLabel.general}</Badge>}
          </div>

          {/* 제목 */}
          <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{post.title}</h2>

          {/* 작성자 · 날짜 */}
          <p className="text-xs text-gray-400 mb-4">
            {post.author?.name ?? '알 수 없음'} ·{' '}
            {new Date(post.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>

          <hr className="border-gray-100 mb-4" />

          {/* 내용 */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>
    </div>
  )
}
