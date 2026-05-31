'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pin, BarChart2, MessageCircle, Send, Heart, CornerDownRight } from 'lucide-react'
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
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string | null
  parent_id: string | null
  author: { name: string } | null
}

export default function PostDetailPage() {
  const { id: clubId, postId } = useParams<{ id: string; postId: string }>()
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const [{ data: postData }, { data: { user } }] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, content, type, is_pinned, created_at, author_id, author:users(name)')
          .eq('id', postId)
          .eq('club_id', clubId)
          .single(),
        supabase.auth.getUser(),
      ])

      setPost(postData as Post | null)

      const currentUserId = user?.id ?? null
      setUserId(currentUserId)

      const supabase2 = createClient()
      const [{ count }, { data: userLike }] = await Promise.all([
        supabase2
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId),
        currentUserId
          ? supabase2
              .from('post_likes')
              .select('id')
              .eq('post_id', postId)
              .eq('user_id', currentUserId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      setLikeCount(count ?? 0)
      setIsLiked(!!userLike)
      setPageLoading(false)
    }

    load()
  }, [postId, clubId])

  const assembleComments = async (flat: any[]): Promise<Comment[]> => {
    const supabase = createClient()
    const userIds = [...new Set(flat.map((c: any) => c.user_id).filter(Boolean))]
    let nameMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)
      if (error) console.error('댓글 유저 조회 에러:', error)
      users?.forEach((u: any) => { nameMap[u.id] = u.name })
    }
    return flat.map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id ?? null,
      parent_id: c.parent_id ?? null,
      author: c.user_id ? { name: nameMap[c.user_id] ?? '알 수 없음' } : null,
    }))
  }

  const loadComments = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) { console.error('댓글 fetch 에러:', error); setCommentsLoading(false); return }
    setComments(await assembleComments(data ?? []))
    setCommentsLoading(false)
  }

  const fetchComments = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) { console.error('댓글 fetch 에러:', error); return }
    setComments(await assembleComments(data ?? []))
  }

  useEffect(() => {
    loadComments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (!error) setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId))
  }

  const handleCommentEditSave = async (commentId: string) => {
    if (!editCommentContent.trim()) return
    const supabase = createClient()
    const { error } = await supabase
      .from('comments')
      .update({ content: editCommentContent.trim() })
      .eq('id', commentId)
    if (!error) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentContent.trim() } : c))
      setEditingCommentId(null)
    }
  }

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim() || !userId) return
    setReplySubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: replyText.trim(),
      parent_id: parentId,
    })
    if (error) {
      console.error('댓글 insert 에러:', error)
    } else {
      setReplyText('')
      setReplyingToId(null)
      await fetchComments()
    }
    setReplySubmitting(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    router.push(`/clubs/${clubId}/board`)
  }

  const handleEditSave = async () => {
    if (!editContent.trim()) return
    const supabase = createClient()
    const { error } = await supabase
      .from('posts')
      .update({ content: editContent.trim() })
      .eq('id', postId)
    if (!error) {
      setPost(prev => prev ? { ...prev, content: editContent.trim() } : prev)
      setIsEditing(false)
    }
  }

  const handleLike = async () => {
    if (!userId) return

    const prevLiked = isLiked
    const prevCount = likeCount
    setIsLiked(!prevLiked)
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1)

    const supabase = createClient()
    if (prevLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
      if (error) { setIsLiked(prevLiked); setLikeCount(prevCount) }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId })
      if (error) { setIsLiked(prevLiked); setLikeCount(prevCount) }
    }
  }

  const handleSubmit = async () => {
    if (!commentText.trim() || !userId) return
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: commentText.trim(),
      parent_id: null,
    })
    if (error) {
      console.error('댓글 insert 에러:', error)
    } else {
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

  const rootComments = comments.filter(c => !c.parent_id)
  const totalCount = comments.length

  const renderComment = (c: Comment, isReply = false) => (
    <div key={c.id} className={isReply ? 'ml-8 mt-1' : ''}>
      <div className={`bg-white rounded-xl border border-gray-200 px-4 py-3 ${isReply ? 'border-l-2 border-l-gray-200' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            {isReply && <CornerDownRight size={12} className="text-gray-400" />}
            {c.author?.name ?? '알 수 없음'}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}{' '}
              {new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* 답글 버튼 — 로그인한 유저이면 대댓글에는 표시 안 함 (1단계만 허용) */}
            {userId && !isReply && editingCommentId !== c.id && (
              <button
                onClick={() => { setReplyingToId(replyingToId === c.id ? null : c.id); setReplyText('') }}
                className="text-xs text-gray-400 hover:text-[#C0392B]"
              >
                답글
              </button>
            )}
            {userId && userId === c.user_id && (
              editingCommentId === c.id ? (
                <>
                  <button onClick={() => handleCommentEditSave(c.id)} className="text-xs text-[#C0392B] hover:underline font-medium">저장</button>
                  <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-400 hover:underline">취소</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditCommentContent(c.content); setEditingCommentId(c.id) }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >수정</button>
                  <button onClick={() => handleCommentDelete(c.id)} className="text-xs text-gray-400 hover:text-red-500">삭제</button>
                </>
              )
            )}
          </div>
        </div>
        {editingCommentId === c.id ? (
          <textarea
            value={editCommentContent}
            onChange={e => setEditCommentContent(e.target.value)}
            rows={3}
            className="w-full mt-1 text-sm text-gray-800 leading-relaxed resize-none outline-none border border-gray-200 rounded-lg px-3 py-2 focus:border-[#C0392B] focus:ring-2 focus:ring-[#FADBD8]"
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
        )}
      </div>

      {/* 답글 입력창 */}
      {!isReply && replyingToId === c.id && userId && (
        <div className="ml-8 mt-1 bg-white rounded-xl border border-gray-200 p-3 flex gap-2 items-end">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySubmit(c.id) } }}
            placeholder="답글을 입력하세요…"
            rows={2}
            autoFocus
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleReplySubmit(c.id)}
              disabled={replySubmitting || !replyText.trim()}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-[#C0392B] text-white disabled:opacity-40 hover:bg-[#a93226] transition-colors"
            >
              <Send size={13} />
            </button>
            <button
              onClick={() => { setReplyingToId(null); setReplyText('') }}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 해당 댓글의 대댓글 목록 */}
      {!isReply && comments.filter(r => r.parent_id === c.id).map(reply => renderComment(reply, true))}
    </div>
  )

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
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">
              {post.author?.name ?? '알 수 없음'} ·{' '}
              {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {userId && userId === post.author_id && (
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button onClick={handleEditSave} className="text-xs text-[#C0392B] hover:underline font-medium">저장</button>
                    <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:underline">취소</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditContent(post.content); setIsEditing(true) }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >수정</button>
                    <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-red-500">삭제</button>
                  </>
                )}
              </div>
            )}
          </div>
          <hr className="border-gray-100 mb-4" />
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={8}
              className="w-full text-sm text-gray-800 leading-relaxed resize-none outline-none border border-gray-200 rounded-lg px-3 py-2 focus:border-[#C0392B] focus:ring-2 focus:ring-[#FADBD8]"
            />
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          )}

          {/* 좋아요 버튼 */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={!userId}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${isLiked
                  ? 'bg-red-50 text-[#C0392B]'
                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-[#C0392B]'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Heart
                size={16}
                className={`transition-transform ${isLiked ? 'scale-110' : ''}`}
                fill={isLiked ? '#C0392B' : 'none'}
                stroke={isLiked ? '#C0392B' : 'currentColor'}
              />
              <span>{likeCount}</span>
            </button>
            {!userId && (
              <span className="text-xs text-gray-400">로그인 후 좋아요를 누를 수 있습니다.</span>
            )}
          </div>
        </div>

        {/* ── 댓글 섹션 ── */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <MessageCircle size={15} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              {commentsLoading ? '댓글 로딩 중...' : `댓글 ${totalCount}개`}
            </span>
          </div>

          {/* 댓글 + 대댓글 목록 */}
          <div className="flex flex-col gap-2 mb-4">
            {!commentsLoading && rootComments.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-6">
                아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
              </p>
            )}
            {rootComments.map(c => renderComment(c, false))}
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
