'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ClubCategory } from '@/types'

const CATEGORIES: ClubCategory[] = ['교양', '학술', '문화', '봉사', '체육', '종교']

export default function CategoryFilter({ selected }: { selected?: ClubCategory }) {
  const router = useRouter()
  const pathname = usePathname()

  const go = (cat?: ClubCategory) => {
    const url = cat ? `${pathname}?category=${cat}` : pathname
    router.push(url)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => go()}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
          ${!selected ? 'bg-[#C0392B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        전체
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => go(cat)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${selected === cat ? 'bg-[#C0392B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
