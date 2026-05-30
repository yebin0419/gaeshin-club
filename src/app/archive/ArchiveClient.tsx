'use client'

import { useState } from 'react'
import { BookOpen, FileText, Image, Calendar, ChevronRight } from 'lucide-react'
import { Club } from '@/types'

const categoryEmoji: Record<string, string> = {
  교양: '🎨', 학술: '📚', 문화: '🎭', 봉사: '🤝', 체육: '⚽', 종교: '✝️',
}

const YEARS = [2025, 2024, 2023, 2022]

interface Props {
  clubs: Club[]
}

export default function ArchiveClient({ clubs }: Props) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(clubs[0] ?? null)
  const [selectedYear, setSelectedYear] = useState(YEARS[0])

  return (
    <div className="flex gap-4 min-h-[calc(100vh-160px)]">
      {/* 사이드바 */}
      <aside className="w-36 shrink-0 flex flex-col gap-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">동아리</p>
        {clubs.map(club => (
          <button
            key={club.id}
            onClick={() => setSelectedClub(club)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors truncate
              ${selectedClub?.id === club.id
                ? 'bg-[#C0392B] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span className="mr-1.5">{categoryEmoji[club.category] ?? '🏫'}</span>
            {club.name}
          </button>
        ))}
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {selectedClub ? (
          <>
            {/* 클럽 헤더 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{categoryEmoji[selectedClub.category] ?? '🏫'}</span>
                <div>
                  <h2 className="font-bold text-gray-900 text-base leading-tight">{selectedClub.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedClub.category} 분과 · 기록실</p>
                </div>
              </div>
            </div>

            {/* 연도 탭 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {YEARS.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${selectedYear === year
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {year}년
                </button>
              ))}
            </div>

            {/* 섹션 카드들 */}
            <div className="flex flex-col gap-3">
              <SectionCard
                icon={<Calendar size={16} className="text-blue-500" />}
                title="행사 · 활동 기록"
                description={`${selectedYear}년 주요 행사 및 활동 내역`}
              />
              <SectionCard
                icon={<FileText size={16} className="text-green-500" />}
                title="문서 · 자료실"
                description="회칙, 기획안, 결과보고서 등 공식 문서"
              />
              <SectionCard
                icon={<Image size={16} className="text-purple-500" />}
                title="사진 · 미디어"
                description="활동 사진 및 영상 아카이브"
              />
              <SectionCard
                icon={<BookOpen size={16} className="text-orange-500" />}
                title="연간 리포트"
                description={`${selectedYear}년 동아리 운영 결산 보고`}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 gap-3">
            <BookOpen size={36} className="text-gray-300" />
            <p className="text-sm">좌측에서 동아리를 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors cursor-pointer group">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0 group-hover:text-gray-400 transition-colors" />
    </div>
  )
}
