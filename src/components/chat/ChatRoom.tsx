'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: { name: string } | null
}

interface Props {
  roomId: string
  title: string
  currentUserId: string
  messages: Message[]
  canSend: boolean
  backHref: string
}

export default function ChatRoom({ roomId, title, currentUserId, messages: initialMessages, canSend, backHref }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 최초 진입 시 즉시 맨 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  // 새 메시지 도착 시 부드럽게 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const newMsg = payload.new as Message
          // 내가 보낸 메시지는 이미 낙관적 업데이트로 추가됨 → 중복 제거
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // 상대방 이름 후속 fetch (실시간 이벤트엔 join 데이터 없음)
          if (newMsg.sender_id !== currentUserId) {
            const { data } = await supabase.from('users').select('name').eq('id', newMsg.sender_id).single()
            setMessages(prev =>
              prev.map(m => m.id === newMsg.id ? { ...m, sender: data } : m)
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, currentUserId])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, sender_id: currentUserId, content: text })
      .select()
      .single()

    if (!error && inserted) {
      setMessages(prev => {
        if (prev.some(m => m.id === inserted.id)) return prev
        return [...prev, inserted as Message]
      })
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#B2C7D9]">
      {/* 헤더 */}
      <div className="bg-[#3C5A78] flex items-center gap-3 px-4 py-3">
        <button onClick={() => router.push(backHref)} className="p-1 text-white/80 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-base text-white truncate">{title}</h1>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-white/70 mt-16">아직 메시지가 없습니다.</p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                {!isMe && (
                  <span className="text-xs text-white/80 font-medium mb-1 ml-1">
                    {msg.sender?.name ?? ''}
                  </span>
                )}
                <div className="flex items-end gap-1.5">
                  {isMe && (
                    <span className="text-[10px] text-white/60 self-end mb-0.5">
                      {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed break-words
                      ${isMe
                        ? 'bg-[#FEE500] text-gray-900 rounded-2xl rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm'
                      }`}
                  >
                    {msg.content}
                  </div>
                  {!isMe && (
                    <span className="text-[10px] text-white/60 self-end mb-0.5">
                      {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      {canSend ? (
        <div className="bg-white border-t border-gray-200 px-3 py-2.5 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력... (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            className="flex-1 px-3 py-2 bg-gray-100 rounded-2xl text-sm resize-none outline-none
              focus:bg-white focus:ring-2 focus:ring-[#FEE500] transition-colors max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-full bg-[#FEE500] flex items-center justify-center
              disabled:bg-gray-200 hover:bg-yellow-400 transition-colors flex-shrink-0"
          >
            <Send size={15} className="text-gray-800" />
          </button>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-200 px-4 py-3 text-center">
          <p className="text-sm text-gray-400">공지사항 읽기 전용 방입니다.</p>
        </div>
      )}
    </div>
  )
}
