import { BookOpen } from 'lucide-react'

export default function ArchivePage() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">아카이브</h2>
        <p className="text-sm text-gray-500 mt-0.5">동아리 활동 기록을 모아볼 수 있어요</p>
      </div>

      <div className="flex flex-col items-center justify-center mt-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <BookOpen size={32} className="text-gray-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-700">준비 중입니다</p>
          <p className="text-sm text-gray-400 mt-1">더 나은 서비스로 곧 찾아올게요!</p>
        </div>
      </div>
    </div>
  )
}
