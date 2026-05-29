export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ClubCard from '@/components/clubs/ClubCard'
import CategoryFilter from '@/components/clubs/CategoryFilter'
import { Club, ClubCategory } from '@/types'

interface HomePageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const category = params.category as ClubCategory | undefined

  let query = supabase
    .from('clubs')
    .select('*')
    .eq('is_central', true)
    .order('name')

  if (category) query = query.eq('category', category)

  const { data: clubs } = await query

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">중앙동아리</h2>
        <p className="text-sm text-gray-500 mt-0.5">충북대학교 공식 중앙동아리를 탐색하세요</p>
      </div>

      <CategoryFilter selected={category} />

      {clubs && clubs.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {clubs.map((club: Club) => <ClubCard key={club.id} club={club} />)}
        </div>
      ) : (
        <div className="mt-10 text-center text-gray-400">
          <p>해당 분과에 동아리가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
