'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  author: { name: string } | null
}

export default function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // [디버그] 컴포넌트 렌더링 확인
  console.log('[PostComments] 렌더링됨, postId:', postId)

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      // 유저 세션 확인
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[PostComments] 유저 ID:', user?.id ?? 'null')
      setUserId(user?.id ?? null)

      // 댓글 불러오기
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, author:users(name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      console.log('[PostComments] 댓글 데이터:', data)
      console.log('[PostComments] 댓글 에러:', error)

      setComments((data as Comment[]) ?? [])
      setLoading(false)
    }

    init()
  }, [postId])

  const refetch = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, author:users(name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments((data as Comment[]) ?? [])
  }

  const handleSubmit = async () => {
    if (!content.trim() || !userId) return
    const supabase = createClient()
    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
    })
    console.log('[PostComments] 등록 에러:', error)
    if (!error) {
      setContent('')
      await refetch()
    }
    setSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="mt-4">
      {/* 댓글 수 */}
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <MessageCircle size={15} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-600">
          {loading ? '댓글 로딩 중...' : `댓글 ${comments.length}개`}
        </span>
      </div>

      {/* 댓글 목록 */}
      {!loading && (
        <div className="flex flex-col gap-2 mb-4">
          {comments.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-6">
              아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
            </p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">
                    {c.author?.name ?? '알 수 없음'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}{' '}
                    {new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 댓글 입력 — 로그인 유저라면 누구나 */}
      {!loading && (
        userId ? (
          <div className="bg-white rounded-xl border border-gray-200 p-3 flex gap-2 items-end">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="댓글을 입력하세요… (Enter로 등록, Shift+Enter 줄바꿈)"
              rows={2}
              className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-[#C0392B] text-white disabled:opacity-40 hover:bg-[#a93226] transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        ) : (
          <p className="text-xs text-center text-gray-400 py-3">
            로그인 후 댓글을 작성할 수 있습니다.
          </p>
        )
      )}
    </div>
  )
}
