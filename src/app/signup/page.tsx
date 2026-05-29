'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ClubCategory } from '@/types'

const CATEGORIES: ClubCategory[] = ['교양', '학술', '문화', '봉사', '체육', '종교']

const CENTRAL_CLUBS: { name: string; category: ClubCategory }[] = [
  { name: '다이다이', category: '교양' }, { name: 'Roll Dice', category: '교양' }, { name: 'Youth Culture', category: '교양' },
  { name: 'AVES', category: '학술' }, { name: '가온', category: '학술' }, { name: '한별', category: '학술' }, { name: '보이는소리', category: '학술' }, { name: 'VITALL', category: '학술' },
  { name: 'SIVA CREW', category: '문화' }, { name: '극예술 연구회 (시네씨아)', category: '문화' }, { name: '꼴로르', category: '문화' },
  { name: '민속연구회', category: '문화' }, { name: '블랙홀', category: '문화' }, { name: '소용돌이', category: '문화' },
  { name: '소울로직', category: '문화' }, { name: '아르페지오', category: '문화' }, { name: '징검다리사진반', category: '문화' },
  { name: '창문학동인회', category: '문화' }, { name: '푸른소리', category: '문화' }, { name: '홀리보이스', category: '문화' },
  { name: '폴리포니', category: '문화' }, { name: 'RHEIN Philharmonic', category: '문화' }, { name: '늘해랑', category: '문화' }, { name: '어뮤즈먼트', category: '문화' },
  { name: 'RCY', category: '봉사' }, { name: '로타랙트', category: '봉사' }, { name: '어울림', category: '봉사' }, { name: '위더스', category: '봉사' }, { name: 'ADOZ in Green On', category: '봉사' }, { name: '아이펫츄', category: '봉사' },
  { name: '타우루스', category: '체육' }, { name: '바이펙스', category: '체육' }, { name: '화랑검우회', category: '체육' }, { name: '물밑세상', category: '체육' },
  { name: '반쪽날개', category: '체육' }, { name: '수영사랑', category: '체육' }, { name: '콕콕', category: '체육' }, { name: '태극태권도연구회', category: '체육' },
  { name: '페가수스', category: '체육' }, { name: '푸른밀가루', category: '체육' }, { name: '엣지', category: '체육' }, { name: 'Light Weight', category: '체육' }, { name: '북두칠성', category: '체육' },
  { name: 'C.C.C', category: '종교' }, { name: 'I.V.F', category: '종교' }, { name: 'I.Y.F', category: '종교' }, { name: 'SFC', category: '종교' },
  { name: '가톨릭학생회', category: '종교' }, { name: '불교학생회', category: '종교' }, { name: '네비게이토', category: '종교' },
]

type Step = 'info' | 'student-id' | 'club-owner'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — 기본 정보
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [studentId, setStudentId] = useState('')

  // Step 2 — 학생증
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Step 3 — 방장 옵션
  const [isOwner, setIsOwner] = useState(false)
  const [selectedClub, setSelectedClub] = useState('')
  const [newClubName, setNewClubName] = useState('')
  const [newClubCategory, setNewClubCategory] = useState<ClubCategory>('문화')
  const [newClubDesc, setNewClubDesc] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!imageFile) { setError('학생증 이미지를 업로드해 주세요.'); return }
    setLoading(true)
    setError('')

    try {
      // 1. Auth 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError || !authData.user) throw new Error(authError?.message || '계정 생성 실패')

      const userId = authData.user.id

      // 2. 학생증 업로드
      const ext = imageFile.name.split('.').pop()
      const { error: uploadError } = await supabase.storage
        .from('student-ids')
        .upload(`${userId}.${ext}`, imageFile, { upsert: true })
      if (uploadError) throw new Error('이미지 업로드 실패')

      const { data: urlData } = supabase.storage.from('student-ids').getPublicUrl(`${userId}.${ext}`)

      // 3. users 프로필 생성
      await supabase.from('users').insert({
        id: userId,
        email,
        name,
        department,
        student_id: studentId,
        role: 'user',
        status: 'pending',
        student_id_url: urlData.publicUrl,
      })

      // 4. 방장 신청
      if (isOwner) {
        if (selectedClub) {
          // 기존 중앙동아리에 방장 신청 요청
          await supabase.from('owner_requests').insert({ user_id: userId, club_name: selectedClub, type: 'central' })
        } else if (newClubName) {
          // 신규 동아리 개설 신청
          await supabase.from('owner_requests').insert({
            user_id: userId, club_name: newClubName, category: newClubCategory,
            description: newClubDesc, type: 'new',
          })
        }
      }

      router.push('/pending')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#C0392B]">개신클럽</h1>
          <p className="text-sm text-gray-500 mt-1">충북대 재학생 인증 후 이용 가능합니다</p>
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center gap-2 mb-6">
          {(['info', 'student-id', 'club-owner'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${step === s ? 'bg-[#C0392B] text-white' : i < (['info','student-id','club-owner'] as Step[]).indexOf(step) ? 'bg-[#FADBD8] text-[#C0392B]' : 'bg-gray-200 text-gray-400'}`}>
                {i + 1}
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Step 1: 기본 정보 */}
          {step === 'info' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-800">기본 정보 입력</h2>
              <Input label="이름" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" required />
              <Input label="학과" value={department} onChange={e => setDepartment(e.target.value)} placeholder="소프트웨어학과" required />
              <Input label="학번" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="2021xxxxxx" required />
              <Input label="이메일" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@cbnu.ac.kr" required />
              <Input label="비밀번호" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상" minLength={8} required />
              <Button className="w-full" onClick={() => { if (name && department && studentId && email && password) setStep('student-id'); else setError('모든 항목을 입력해 주세요.') }}>
                다음
              </Button>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )}

          {/* Step 2: 학생증 업로드 */}
          {step === 'student-id' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-800">학생증 인증</h2>
              <div className="bg-[#FADBD8] rounded-lg p-3 text-xs text-[#C0392B] leading-relaxed">
                ⚠️ 업로드 전 <strong>이름·학과·학번</strong> 외 개인정보(사진 등)는 가려주세요.
                승인 완료 후 이미지는 즉시 삭제됩니다.
              </div>
              <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="학생증 미리보기" className="w-full rounded-lg object-cover max-h-48" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-[#C0392B] hover:text-[#C0392B] transition-colors">
                  <Upload size={28} />
                  <span className="text-sm">이미지 선택</span>
                </button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('info')}>이전</Button>
                <Button className="flex-1" onClick={() => { if (imageFile) setStep('club-owner'); else setError('이미지를 업로드해 주세요.') }}>다음</Button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )}

          {/* Step 3: 방장 옵션 */}
          {step === 'club-owner' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-800">동아리 방장 신청</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isOwner} onChange={e => setIsOwner(e.target.checked)} className="w-4 h-4 accent-[#C0392B]" />
                <span className="text-sm font-medium text-gray-700">회장(방장)입니다</span>
              </label>

              {isOwner && (
                <div className="flex flex-col gap-3 pl-1">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">중앙동아리 선택</label>
                    <select value={selectedClub} onChange={e => setSelectedClub(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C0392B]">
                      <option value="">-- 해당 동아리를 선택하세요 --</option>
                      {CENTRAL_CLUBS.map(c => (
                        <option key={c.name} value={c.name}>[{c.category}] {c.name}</option>
                      ))}
                    </select>
                  </div>
                  {!selectedClub && (
                    <div className="flex flex-col gap-2 border-t pt-3">
                      <p className="text-xs text-gray-500">목록에 없다면 직접 입력하세요</p>
                      <Input label="동아리명" value={newClubName} onChange={e => setNewClubName(e.target.value)} placeholder="동아리 이름" />
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">분과</label>
                        <select value={newClubCategory} onChange={e => setNewClubCategory(e.target.value as ClubCategory)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C0392B]">
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">소개</label>
                        <textarea value={newClubDesc} onChange={e => setNewClubDesc(e.target.value)} rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C0392B] resize-none"
                          placeholder="동아리를 간단히 소개해 주세요" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('student-id')}>이전</Button>
                <Button className="flex-1" loading={loading} onClick={handleSubmit}>가입 신청</Button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-[#C0392B] font-medium hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  )
}
