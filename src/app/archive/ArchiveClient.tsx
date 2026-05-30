'use client'

import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Calendar, Tag, ImageOff, Loader2, FolderOpen, Upload, X, ImagePlus } from 'lucide-react'
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

const PRESET_TAGS = ['활동사진', '문서', '프로젝트', '공연', '행사', '캠프', '친목', '학술', '봉사', '결산']

interface Props {
  clubs: Club[]
}

export default function ArchiveClient({ clubs }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const uniqueClubs = Array.from(new Map(clubs.map(c => [c.name, c])).values())
  const [selectedClub, setSelectedClub] = useState<Club | null>(uniqueClubs[0] ?? null)
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 폼 상태
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formPreview, setFormPreview] = useState<string | null>(null)
  const [formDescription, setFormDescription] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!selectedClub || !userId) { setIsOwner(false); return }

    Promise.all([
      // 조건 1: 이 동아리의 owner인지
      supabase
        .from('club_members')
        .select('role')
        .eq('club_id', selectedClub.id)
        .eq('user_id', userId)
        .eq('role', 'owner')
        .maybeSingle(),
      // 조건 2: 앱 전체 관리자(app_admin)인지
      supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle(),
    ]).then(([clubRes, userRes]) => {
      const isClubOwner = !!clubRes.data
      const isAppAdmin = userRes.data?.role === 'app_admin'
      const result = isClubOwner || isAppAdmin

      console.log('1. 현재 로그인한 유저 ID:', userId)
      console.log('2. 현재 선택된 동아리 ID:', selectedClub?.id, '/ 동아리명:', selectedClub?.name)
      console.log('3. 현재 로그인한 유저의 Role (users 테이블):', userRes.data?.role)
      console.log('4. 이 동아리의 club_members 조회 결과:', clubRes.data)
      console.log('5. 최종 관리자 권한 결과 (isOwner):', result)

      setIsOwner(result)
    })
  }, [selectedClub?.id, userId])

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

  const refreshArchives = () => {
    if (!selectedClub) return
    fetchArchives(selectedClub.id).then(setArchives)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDate('')
    setFormFile(null)
    setFormPreview(null)
    setFormDescription('')
    setFormTags([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setFormFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setFormPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setFormPreview(null)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const toggleTag = (tag: string) => {
    setFormTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleUpload = async () => {
    if (!formTitle.trim()) { alert('자료 제목을 입력해 주세요.'); return }
    if (!formDate) { alert('활동 날짜를 선택해 주세요.'); return }
    if (!selectedClub || !userId) { alert('동아리 또는 로그인 정보를 확인해 주세요.'); return }

    setUploading(true)

    // 1. 이미지 파일이 있으면 Storage에 먼저 업로드
    let thumbnailUrl: string | null = null
    if (formFile) {
      const ext = formFile.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: storageError } = await supabase.storage
        .from('archive_images')
        .upload(fileName, formFile, { cacheControl: '3600', upsert: false })

      if (storageError) {
        setUploading(false)
        alert(`이미지 업로드에 실패했습니다.\n${storageError.message}`)
        return
      }

      const { data: urlData } = supabase.storage
        .from('archive_images')
        .getPublicUrl(fileName)
      thumbnailUrl = urlData.publicUrl
    }

    // 2. archives 테이블에 insert
    const year = new Date(formDate).getFullYear()
    const { error } = await supabase.from('archives').insert({
      club_id: selectedClub.id,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      thumbnail_url: thumbnailUrl,
      file_url: null,
      year,
      tags: formTags,
      uploaded_by: userId,
    })

    setUploading(false)

    if (error) {
      alert(`자료 저장에 실패했습니다.\n${error.message}`)
      return
    }

    handleCloseModal()
    refreshArchives()
  }

  return (
    <>
      <div className="flex gap-0 min-h-[calc(100vh-160px)]">

        {/* ── 사이드바 ───────────────────────────────────────────── */}
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

        {/* ── 메인 갤러리 영역 ────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {selectedClub ? (
            <>
              {/* 헤더 */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryEmoji[selectedClub.category] ?? '🏫'}</span>
                    <h2 className="text-xl font-bold text-gray-900">{selectedClub.name}</h2>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C0392B] text-white text-sm font-semibold shadow-sm hover:bg-[#a93226] active:scale-95 transition-all"
                    >
                      <Upload size={15} />
                      자료 업로드
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {selectedClub.name} 동아리의 소중한 기록들입니다. 활동 사진, 문서, 프로젝트 자료를 한눈에 열람하세요.
                </p>
              </div>

              {loading && (
                <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">불러오는 중...</span>
                </div>
              )}

              {!loading && archives.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <FolderOpen size={26} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">아직 등록된 자료가 없습니다.</p>
                  <p className="text-xs text-gray-400">활동 사진, 문서, 기록을 업로드해 보세요.</p>
                </div>
              )}

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

      {/* ── 업로드 모달 ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* 배경 딤 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* 모달 본체 */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">자료 업로드</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedClub?.name}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 모달 폼 */}
            <div className="px-6 py-5 flex flex-col gap-4">

              {/* 자료 제목 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  자료 제목 <span className="text-[#C0392B]">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="예: 2024 정기공연 현장 사진"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B] transition"
                />
              </div>

              {/* 활동 날짜 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  활동 날짜 <span className="text-[#C0392B]">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B] transition"
                />
              </div>

              {/* 이미지 파일 업로드 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  이미지 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <label className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden
                  ${formPreview ? 'border-transparent' : 'border-gray-200 hover:border-[#C0392B]/40 hover:bg-[#C0392B]/5'}`}>
                  {formPreview ? (
                    <div className="relative w-full">
                      <img src={formPreview} alt="미리보기" className="w-full max-h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium">클릭하여 변경</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center gap-2 text-gray-400">
                      <ImagePlus size={24} />
                      <p className="text-xs">클릭하여 사진 선택</p>
                      <p className="text-xs text-gray-300">JPG, PNG, GIF, WEBP</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 간단 설명 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  간단 설명 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="자료에 대한 간단한 설명을 입력하세요."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B] transition resize-none"
                />
              </div>

              {/* 태그 선택 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">태그</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${formTags.includes(tag)
                          ? 'bg-[#C0392B] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="flex gap-2 px-6 pb-5">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-[#C0392B] text-white text-sm font-semibold hover:bg-[#a93226] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {uploading
                  ? <><Loader2 size={14} className="animate-spin" />업로드 중...</>
                  : <><Upload size={14} />업로드</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function GalleryCard({ item }: { item: ArchiveItem }) {
  const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

  return (
    <div className="break-inside-avoid rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group mb-4">
      {item.thumbnail_url ? (
        <img src={item.thumbnail_url} alt={item.title} className="w-full object-cover" />
      ) : (
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
          <ImageOff size={28} className="text-gray-300" />
        </div>
      )}

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
