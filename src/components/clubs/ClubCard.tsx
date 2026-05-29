'use client'

import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Club } from '@/types'

const categoryEmoji: Record<string, string> = {
  교양: '🎨', 학술: '📚', 문화: '🎭', 봉사: '🤝', 체육: '⚽', 종교: '✝️',
}

export default function ClubCard({ club }: { club: Club }) {
  const router = useRouter()

  return (
    <Card onClick={() => router.push(`/clubs/${club.id}`)}>
      <div className="flex flex-col gap-2">
        <div className="text-2xl">{categoryEmoji[club.category] ?? '🏫'}</div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{club.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{club.category}</p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <Badge variant={club.is_recruiting ? 'primary' : 'default'}>
            {club.is_recruiting ? '모집 중' : '모집 마감'}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
