'use client'

import { useRouter } from 'next/navigation'
import { Bell, Search, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => router.push('/home')} className="text-xl font-bold text-[#C0392B]">
          개신클럽
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/search')}
            className="p-2 text-gray-500 hover:text-[#C0392B] hover:bg-[#FADBD8] rounded-lg transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => router.push('/notifications')}
            className="p-2 text-gray-500 hover:text-[#C0392B] hover:bg-[#FADBD8] rounded-lg transition-colors"
          >
            <Bell size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
