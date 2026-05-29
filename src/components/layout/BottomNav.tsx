'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, BookOpen, User } from 'lucide-react'

const navItems = [
  { icon: Home, label: '홈', href: '/home' },
  { icon: Search, label: '검색', href: '/search' },
  { icon: BookOpen, label: '아카이브', href: '/archive' },
  { icon: User, label: '내 정보', href: '/profile' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-2xl mx-auto px-4 flex">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname.startsWith(href)
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors
                ${active ? 'text-[#C0392B]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
