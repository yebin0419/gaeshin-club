'use client'

import { useState } from 'react'
import { BookOpen, Calendar, Tag, ImageOff } from 'lucide-react'
import { Club } from '@/types'

// ─── 더미 데이터 (추후 Supabase archives 테이블로 교체) ───────────────────────
// 실제 연동 시 아래 타입과 fetchArchives 함수를 사용하세요.
//
// interface ArchiveItem {
//   id: string
//   club_id: string
//   title: string
//   description: string | null
//   file_url: string | null
//   thumbnail_url: string | null
//   year: number
//   tags: string[]
//   created_at: string
// }
//
// async function fetchArchives(clubId: string): Promise<ArchiveItem[]> {
//   const supabase = createClient()
//   const { data } = await supabase
//     .from('archives')
//     .select('*')
//     .eq('club_id', clubId)
//     .order('created_at', { ascending: false })
//   return data ?? []
// }
// ─────────────────────────────────────────────────────────────────────────────

interface DummyCard {
  id: number
  title: string
  date: string
  tags: string[]
  color: string
  tall: boolean
}

const DUMMY_CARDS: DummyCard[] = [
  { id: 1, title: '2024 정기공연 현장', date: '2024.11.20', tags: ['#활동사진', '#공연'], color: 'bg-rose-100', tall: true },
  { id: 2, title: '신입부원 OT 자료', date: '2024.03.05', tags: ['#문서', '#OT'], color: 'bg-blue-100', tall: false },
  { id: 3, title: '여름 캠프 스케치', date: '2024.07.18', tags: ['#활동사진', '#캠프'], color: 'bg-amber-100', tall: false },
  { id: 4, title: '2023 연간 결산 보고서', date: '2023.12.28', tags: ['#문서', '#결산'], color: 'bg-green-100', tall: true },
  { id: 5, title: '봄 축제 부스 운영', date: '2024.05.10', tags: ['#활동사진', '#축제'], color: 'bg-purple-100', tall: false },
  { id: 6, title: '회칙 개정안 v2.1', date: '2024.02.14', tags: ['#문서', '#회칙'], color: 'bg-sky-100', tall: false },
  { id: 7, title: '겨울 종무식 사진첩', date: '2023.12.15', tags: ['#활동사진', '#행사'], color: 'bg-orange-100', tall: true },
  { id: 8, title: '프로젝트 기획안 #3', date: '2024.09.01', tags: ['#프로젝트', '#문서'], color: 'bg-teal-100', tall: false },
  { id: 9, title: '신입생 환영회 스냅', date: '2024.03.12', tags: ['#활동사진', '#환영회'], color: 'bg-pink-100', tall: false },
]

const categoryEmoji: Record<string, string> = {
  교양: '🎨', 학술: '📚', 문화: '🎭', 봉사: '🤝', 체육: '⚽', 종교: '✝️',
}

interface Props {
  clubs: Club[]
}

export default function ArchiveClient({ clubs }: Props) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(clubs[0] ?? null)

  return (
    <div className="flex gap-0 min-h-[calc(100vh-160px)]">

      {/* ── 사이드바 ─────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-r border-gray-200 pr-4 mr-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">동아리</p>
        <div className="flex flex-col gap-0.5">
          {clubs.map(club => (
            <button
              key={club.id}
              onClick={() => setSelectedClub(club)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2
                ${selectedClub?.id === club.id
                  ? 'bg-[#C0392B] text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
            >
              <span className="text-base leading-none">{categoryEmoji[club.category] ?? '🏫'}</span>
              <span className="truncate">{club.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── 메인 갤러리 영역 ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {selectedClub ? (
          <>
            {/* 헤더 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{categoryEmoji[selectedClub.category] ?? '🏫'}</span>
                <h2 className="text-xl font-bold text-gray-900">{selectedClub.name}</h2>
              </div>
              <p className="text-sm text-gray-400">
                {selectedClub.name} 동아리의 소중한 기록들입니다. 활동 사진, 문서, 프로젝트 자료를 한눈에 열람하세요.
              </p>
            </div>

            {/* 갤러리 그리드 (Pinterest 2열) */}
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {DUMMY_CARDS.map(card => (
                <GalleryCard key={card.id} card={card} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-300">
            <BookOpen size={40} />
            <p className="text-sm text-gray-400">좌측에서 동아리를 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function GalleryCard({ card }: { card: DummyCard }) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
      {/* 썸네일 */}
      <div className={`w-full ${card.tall ? 'h-48' : 'h-32'} ${card.color} flex items-center justify-center`}>
        <ImageOff size={28} className="text-white/60" />
      </div>

      {/* 카드 정보 */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 leading-snug mb-2 group-hover:text-[#C0392B] transition-colors">
          {card.title}
        </p>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Calendar size={11} />
          <span>{card.date}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {card.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              <Tag size={9} />
              {tag.replace('#', '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
