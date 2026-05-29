'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PostType } from '@/types'
import { use } from 'react'

export default function WritePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<PostType>('general')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title || !content) { setError('제목과 내용을 입력해 주세요.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('posts').insert({
      club_id: id, author_id: user?.id, type, is_pinned: isPinned, title, content,
    })
    if (err) { setError('저장 중 오류가 발생했습니다.'); setLoading(false); return }
    router.push(`/clubs/${id}/board`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 text-gray-500"><ArrowLeft size={22} /></button>
            <h1 className="font-bold text-lg">글 작성</h1>
          </div>
          <Button size="sm" loading={loading} onClick={handleSubmit}>게시</Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
          {/* 게시글 타입 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">게시글 유형</label>
            <div className="flex gap-2">
              {(['general', 'notice', 'poll'] as PostType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors
                    ${type === t ? 'border-[#C0392B] bg-[#FADBD8] text-[#C0392B]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {t === 'general' ? '일반' : t === 'notice' ? '공지' : '수요조사'}
                </button>
              ))}
            </div>
          </div>

          <Input label="제목" value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">내용</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C0392B] focus:ring-2 focus:ring-[#FADBD8] resize-none"
              placeholder="내용을 입력하세요" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="accent-[#C0392B]" />
            <span className="text-sm text-gray-600">상단 고정</span>
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}
