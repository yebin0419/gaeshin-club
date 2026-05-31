export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BoardClient from './BoardClient'

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase.from('clubs').select('name').eq('id', id).single()
  if (!club) notFound()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? null

  const { data: rawPosts } = await supabase
    .from('posts')
    .select('id, title, content, type, is_pinned, created_at, author_id, author:users(name), comments(count), post_likes(count)')
    .eq('club_id', id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const posts = (rawPosts ?? []).map(p => ({
    id: p.id as string,
    title: p.title as string,
    content: p.content as string,
    type: p.type as string,
    is_pinned: p.is_pinned as boolean,
    created_at: p.created_at as string,
    author_id: (p.author_id as string | null) ?? null,
    author_role: null as string | null,
    author: (p.author as unknown) as { name: string } | null,
    comments: (p.comments as { count: number }[]) ?? [],
    post_likes: (p.post_likes as { count: number }[]) ?? [],
  }))

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
        <BoardClient
          clubId={id}
          posts={posts}
          userId={userId}
          isMember={true}
        />
      </div>
    </div>
  )
}
