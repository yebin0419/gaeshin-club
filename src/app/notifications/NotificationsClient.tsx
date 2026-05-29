'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'

export default function NotificationsClient({ notifications: initNoti, userId }: { notifications: Notification[], userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState(initNoti)

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 text-gray-500"><ArrowLeft size={22} /></button>
            <h1 className="font-bold text-lg">알림</h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-[#C0392B] font-medium hover:underline">
              모두 읽음
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="mt-20 text-center text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-40" />
            <p>알림이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(n => (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={`w-full text-left bg-white rounded-xl border p-4 transition-colors
                  ${n.is_read ? 'border-gray-200' : 'border-[#C0392B]/30 bg-[#FADBD8]/20'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2">
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#C0392B] mt-1.5 flex-shrink-0" />}
                    <p className={`text-sm ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.message}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
