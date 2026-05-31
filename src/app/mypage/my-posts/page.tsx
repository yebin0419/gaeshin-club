'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, MessageCircle, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'

interface Post {
  id: string
  title: string
  type: string
  created_at: string
  club_id: string
  club: { id: string; name: string } | null
  comments: { count: number }[]
  post_likes: { count: number }[]
}

export default function MyPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('posts')
        .select('id, title, type, created_at, club_id, club:clubs(id, name), comments(count), post_likes(count)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      setPosts((data as any) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-4">
          <button onClick={() => router.push('/profile')} className="p-1 text-gray-500 hover:text-[#C0392B]">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-lg text-gray-900">내가 쓴 글</h1>
        </div>

        {loading ? (
          <p className="mt-16 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : posts.length === 0 ? (
          <p className="mt-16 text-center text-sm text-gray-400">아직 작성한 글이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/clubs/${post.club_id}/board/${post.id}?returnTo=/mypage/my-posts`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-[#C0392B]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {post.type === 'notice' && <Badge variant="primary">공지</Badge>}
                  {post.type === 'poll'   && <Badge variant="warning"><BarChart2 size={11} className="inline mr-0.5" />수요조사</Badge>}
                  {post.type === 'general' && <Badge variant="default">일반</Badge>}
                  {post.club && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {post.club.name}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{post.title}</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <MessageCircle size={12} />{post.comments?.[0]?.count ?? 0}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Heart size={12} />{post.post_likes?.[0]?.count ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
