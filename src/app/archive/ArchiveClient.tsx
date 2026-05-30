'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Calendar, Tag, ImageOff, Loader2, FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Club } from '@/types'

interface ArchiveItem {
  id: string
  club_id: string
  title: string
  description: string | null
  file_url: string | null
  thumbnail_url: string | null
  year: number
  tags: string[]
  created_at: string
}

async function fetchArchives(clubId: string): Promise<ArchiveItem[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('archives')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
  return data ?? []
}

const categoryEmoji: Record<string, string> = {
  교양: '🎨', 학술: '📚', 문화: '🎭', 봉사: '🤝', 체육: '⚽', 종교: '✝️',
}

interface Props {
  clubs: Club[]
}

export default function ArchiveClient({ clubs }: Props) {
  const uniqueClubs = Array.from(new Map(clubs.map(c => [c.id, c])).values())
  const [selectedClub, setSelectedClub] = useState<Club | null>(uniqueClubs[0] ?? null)
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedClub) return
    setLoading(true)
    fetchArchives(selectedClub.id).then(data => {
      setArchives(data)
      setLoading(false)
    })
  }, [selectedClub?.id])

  const handleSelectClub = (club: Club) => {
    setArchives([])
    setSelectedClub(club)
  }

  return (
    <div className="flex gap-0 min-h-[calc(100vh-160px)]">

      {/* ── 사이드바 ─────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-r border-gray-200 pr-4 mr-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">동아리</p>
        <div className="flex flex-col gap-0.5">
          {uniqueClubs.map(club => (
            <button
              key={club.id}
              onClick={() => handleSelectClub(club)}
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

            {/* 로딩 */}
            {loading && (
              <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">불러오는 중...</span>
              </div>
            )}

            {/* 데이터 없음 */}
            {!loading && archives.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <FolderOpen size={26} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">아직 등록된 자료가 없습니다.</p>
                <p className="text-xs text-gray-400">활동 사진, 문서, 기록을 업로드해 보세요.</p>
              </div>
            )}

            {/* 갤러리 그리드 */}
            {!loading && archives.length > 0 && (
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {archives.map(item => (
                  <GalleryCard key={item.id} item={item} />
                ))}
              </div>
            )}
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

function GalleryCard({ item }: { item: ArchiveItem }) {
  const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

  return (
    <div className="break-inside-avoid rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group mb-4">
      {/* 썸네일 */}
      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className="w-full object-cover"
        />
      ) : (
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
          <ImageOff size={28} className="text-gray-300" />
        </div>
      )}

      {/* 카드 정보 */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 leading-snug mb-2 group-hover:text-[#C0392B] transition-colors">
          {item.title}
        </p>

        {item.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Calendar size={11} />
          <span>{date}</span>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
              >
                <Tag size={9} />
                {tag.replace('#', '')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
