export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import BoardClient from './BoardClient'

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
    .select('id, title, content, type, is_pinned, created_at, author_id, author:users(name)')
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

        <BoardClient
          clubId={id}
          posts={(posts ?? []) as any}
          userId={user?.id ?? null}
        />
      </div>
    </div>
  )
}
