'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pin, BarChart2, MessageCircle, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'

interface Post {
  id: string
  title: string
  content: string
  type: string
  is_pinned: boolean
  created_at: string
  author_id: string | null
  author: { name: string } | null
  comments: { count: number }[]
  post_likes: { count: number }[]
}

interface Props {
  clubId: string
  posts: Post[]
  userId: string | null
}

export default function BoardClient({ clubId, posts, userId }: Props) {
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    router.refresh()
  }

  if (posts.length === 0) {
    return <div className="mt-16 text-center text-gray-400 text-sm">게시글이 없습니다.</div>
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map(post => (
        <div key={post.id} className="relative">
          <Link
            href={`/clubs/${clubId}/board/${post.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-[#C0392B]/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-1.5">
              {post.is_pinned && <Pin size={13} className="text-[#C0392B]" />}
              {post.type === 'notice'  && <Badge variant="primary">공지</Badge>}
              {post.type === 'poll'    && <Badge variant="warning"><BarChart2 size={11} className="inline mr-0.5" />수요조사</Badge>}
              {post.type === 'general' && <Badge variant="default">일반</Badge>}
            </div>
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 pr-16">{post.title}</h3>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-400">
                {post.author?.name ?? '알 수 없음'} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
              </p>
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <MessageCircle size={12} />
                  {post.comments?.[0]?.count ?? 0}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <Heart size={12} />
                  {post.post_likes?.[0]?.count ?? 0}
                </span>
              </div>
            </div>
          </Link>

          {userId && userId === post.author_id && (
            <div className="absolute top-3.5 right-4 flex items-center gap-3">
              <Link
                href={`/clubs/${clubId}/board/${post.id}`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                수정
              </Link>
              <button
                onClick={e => handleDelete(e, post.id)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
