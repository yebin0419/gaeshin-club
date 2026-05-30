'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pin, BarChart2, MessageCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'

interface Post {
  id: string
  title: string
  content: string
  type: string
  is_pinned: boolean
  created_at: string
  author: { name: string } | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  author: { name: string } | null
}

export default function PostDetailPage() {
  const { id: clubId, postId } = useParams<{ id: string; postId: string }>()
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(true)

  // 게시글 + 유저 세션 로드
  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const [{ data: postData }, { data: { user } }] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, content, type, is_pinned, created_at, author:users(name)')
          .eq('id', postId)
          .eq('club_id', clubId)
          .single(),
        supabase.auth.getUser(),
      ])

      setPost(postData as Post | null)
      setUserId(user?.id ?? null)
      setPageLoading(false)
    }

    load()
  }, [postId, clubId])

  // 댓글 로드
  useEffect(() => {
    const supabase = createClient()

    const loadComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('id, content, created_at, author:users(name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      setComments((data as unknown as Comment[]) ?? [])
      setCommentsLoading(false)
    }

    loadComments()
  }, [postId])

  const fetchComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, author:users(name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments((data as unknown as Comment[]) ?? [])
  }

  const handleSubmit = async () => {
    if (!commentText.trim() || !userId) return
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: commentText.trim(),
    })
    if (!error) {
      setCommentText('')
      await fetchComments()
    }
    setSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">게시글을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">

        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-4">
          <Link href={`/clubs/${clubId}/board`} className="p-1 text-gray-500 hover:text-[#C0392B]">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-bold text-lg text-gray-900 truncate">게시글</h1>
        </div>

        {/* 본문 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            {post.is_pinned && <Pin size={13} className="text-[#C0392B]" />}
            {post.type === 'notice'  && <Badge variant="primary">공지</Badge>}
            {post.type === 'poll'    && <Badge variant="warning"><BarChart2 size={11} className="inline mr-0.5" />수요조사</Badge>}
            {post.type === 'general' && <Badge variant="default">일반</Badge>}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{post.title}</h2>
          <p className="text-xs text-gray-400 mb-4">
            {post.author?.name ?? '알 수 없음'} ·{' '}
            {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <hr className="border-gray-100 mb-4" />
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* ── 댓글 섹션 ── */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <MessageCircle size={15} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              {commentsLoading ? '댓글 로딩 중...' : `댓글 ${comments.length}개`}
            </span>
          </div>

          {/* 댓글 목록 */}
          <div className="flex flex-col gap-2 mb-4">
            {!commentsLoading && comments.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-6">
                아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
              </p>
            )}
            {comments.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{c.author?.name ?? '알 수 없음'}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}{' '}
                    {new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>

          {/* 댓글 입력 */}
          {userId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex gap-2 items-end">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="댓글을 입력하세요… (Enter 등록 / Shift+Enter 줄바꿈)"
                rows={2}
                className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !commentText.trim()}
                className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-[#C0392B] text-white disabled:opacity-40 hover:bg-[#a93226] transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
          ) : (
            <p className="text-xs text-center text-gray-400 py-3">로그인 후 댓글을 작성할 수 있습니다.</p>
          )}
        </div>

      </div>
    </div>
  )
}
