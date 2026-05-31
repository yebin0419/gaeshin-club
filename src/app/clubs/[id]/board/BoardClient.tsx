'use client'

import { useState } from 'react'
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
  author_role: string | null
  author: { name: string } | null
  comments: { count: number }[]
  post_likes: { count: number }[]
}

function RoleBadge({ role }: { role: string | null }) {
  if (role === 'owner')
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#C0392B] text-white leading-none">
        👑 방장
      </span>
    )
  if (role === 'staff')
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-600 leading-none">
        스태프
      </span>
    )
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 leading-none">
      부원
    </span>
  )
}

interface Props {
  clubId: string
  posts: Post[]
  userId: string | null
}

export default function BoardClient({ clubId, posts: initialPosts, userId }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  const handleDelete = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('삭제 버튼 눌림! 대상 ID:', postId)
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return
    const supabase = createClient()

    // 1) 좋아요 삭제
    const { error: likesErr } = await supabase
      .from('post_likes').delete().eq('post_id', postId)
    if (likesErr) {
      console.error('DB 삭제 에러 (post_likes):', likesErr)
      alert('DB 삭제 실패: ' + likesErr.message)
      return
    }

    // 2) 댓글 삭제
    const { error: commentsErr } = await supabase
      .from('comments').delete().eq('post_id', postId)
    if (commentsErr) {
      console.error('DB 삭제 에러 (comments):', commentsErr)
      alert('DB 삭제 실패: ' + commentsErr.message)
      return
    }

    // 3) 게시글 삭제 — .select()로 실제 삭제된 행 검증
    const { data: deleted, error: postErr } = await supabase
      .from('posts').delete().eq('id', postId).select('id')
    if (postErr) {
      console.error('DB 삭제 에러 (posts):', postErr)
      alert('DB 삭제 실패: ' + postErr.message)
      return
    }
    if (!deleted || deleted.length === 0) {
      console.error('DB 삭제 실패: 0행 삭제 (RLS 또는 권한 문제)')
      alert('DB 삭제 실패: 권한이 없거나 이미 삭제된 게시글입니다.')
      return
    }

    // 4) 모든 DB 삭제 성공 후 UI 업데이트 + 라우터 캐시 무효화
    console.log('DB 삭제 성공:', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
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
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">{post.author?.name ?? '알 수 없음'}</span>
                <RoleBadge role={post.author_role} />
                <span className="text-xs text-gray-400">· {new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
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
            <div className="absolute top-3.5 right-4 z-10 flex items-center gap-3">
              <Link
                href={`/clubs/${clubId}/board/${post.id}`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                수정
              </Link>
              <button
                type="button"
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
