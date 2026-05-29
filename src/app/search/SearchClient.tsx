'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import ClubCard from '@/components/clubs/ClubCard'
import { Club, ClubCategory } from '@/types'

const CATEGORIES: ClubCategory[] = ['교양', '학술', '문화', '봉사', '체육', '종교']

export default function SearchClient({ allClubs }: { allClubs: Club[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ClubCategory | ''>('')
  const [recruiting, setRecruiting] = useState<boolean | null>(null)

  const filtered = useMemo(() => {
    return allClubs.filter(c => {
      const matchQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase())
      const matchCat = !category || c.category === category
      const matchRec = recruiting === null || c.is_recruiting === recruiting
      return matchQuery && matchCat && matchRec
    })
  }, [allClubs, query, category, recruiting])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24 pt-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">동아리 검색</h2>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="동아리 이름으로 검색"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#C0392B] focus:ring-2 focus:ring-[#FADBD8]"
            />
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCategory('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${!category ? 'bg-[#C0392B] text-white' : 'bg-gray-100 text-gray-600'}`}>
              전체 분과
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat === category ? '' : cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${category === cat ? 'bg-[#C0392B] text-white' : 'bg-gray-100 text-gray-600'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {([null, true, false] as (boolean | null)[]).map(v => (
              <button key={String(v)} onClick={() => setRecruiting(v === recruiting ? null : v)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${recruiting === v && v !== null ? 'bg-[#C0392B] text-white' : 'bg-gray-100 text-gray-600'}`}>
                {v === null ? '모집 상태' : v ? '모집 중' : '모집 마감'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">{filtered.length}개 동아리</p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(club => <ClubCard key={club.id} club={club} />)}
          </div>
        ) : (
          <div className="mt-16 text-center text-gray-400 text-sm">검색 결과가 없습니다.</div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
