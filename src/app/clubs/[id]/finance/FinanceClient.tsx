'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Receipt, Trash2, Pencil, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Finance, FinanceType } from '@/types'

interface Props {
  clubId: string
  clubName: string
  finances: Finance[]
  balance: number
  isStaff: boolean
  isOwner: boolean
}

export default function FinanceClient({ clubId, clubName, finances: initialFinances, isOwner }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [list, setList] = useState<Finance[]>(initialFinances)

  // 추가 폼 상태
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<FinanceType>('income')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // 수정 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editType, setEditType] = useState<FinanceType>('income')
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const balance = list.reduce((acc, f) =>
    f.type === 'income' ? acc + f.amount : acc - f.amount, 0)

  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'

  const handleAdd = async () => {
    if (!amount || !description) { setAddError('금액과 내용을 입력해 주세요.'); return }
    setAddLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    let receipt_url: string | null = null
    if (receiptFile && user) {
      const ext = receiptFile.name.split('.').pop()
      const path = `${clubId}/${Date.now()}.${ext}`
      await supabase.storage.from('receipts').upload(path, receiptFile)
      const { data } = supabase.storage.from('receipts').getPublicUrl(path)
      receipt_url = data.publicUrl
    }

    const { data: inserted, error: err } = await supabase.from('finances').insert({
      club_id: clubId, type, amount: parseInt(amount), description,
      receipt_url, created_by: user?.id,
    }).select().single()

    if (err) { setAddError('저장 중 오류가 발생했습니다.'); setAddLoading(false); return }

    setList(prev => [inserted as Finance, ...prev])
    setShowForm(false); setAmount(''); setDescription(''); setReceiptFile(null)
    setAddLoading(false)
  }

  const startEdit = (f: Finance) => {
    setEditingId(f.id)
    setEditType(f.type)
    setEditAmount(String(f.amount))
    setEditDescription(f.description)
  }

  const handleUpdate = async () => {
    if (!editAmount || !editDescription || !editingId) return
    setEditLoading(true)
    const { data: updated, error: err } = await supabase
      .from('finances')
      .update({ type: editType, amount: parseInt(editAmount), description: editDescription })
      .eq('id', editingId)
      .select()
      .single()

    if (err) { alert('수정 중 오류가 발생했습니다.'); setEditLoading(false); return }

    setList(prev => prev.map(f => f.id === editingId ? updated as Finance : f))
    setEditingId(null)
    setEditLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 내역을 삭제하시겠습니까?')) return
    const { error: err } = await supabase.from('finances').delete().eq('id', id)
    if (err) { alert(`삭제 중 오류가 발생했습니다.\n${err.message}`); return }
    setList(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="sticky top-0 bg-gray-50 z-10 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 text-gray-500"><ArrowLeft size={22} /></button>
            <h1 className="font-bold text-lg">{clubName} 회비</h1>
          </div>
          {isOwner && (
            <Button size="sm" onClick={() => { setShowForm(v => !v); setEditingId(null) }}>
              <Plus size={15} />내역 추가
            </Button>
          )}
        </div>

        {/* 잔액 카드 */}
        <div className="bg-[#C0392B] rounded-2xl p-6 text-white mb-4">
          <p className="text-sm opacity-80 mb-1">현재 잔액</p>
          <p className="text-3xl font-bold">{fmt(balance)}</p>
        </div>

        {/* 내역 추가 폼 (방장 전용) */}
        {isOwner && showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800">내역 추가</h3>
            <div className="flex gap-2">
              {(['income', 'expense'] as FinanceType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors
                    ${type === t ? 'border-[#C0392B] bg-[#FADBD8] text-[#C0392B]' : 'border-gray-200 text-gray-500'}`}>
                  {t === 'income' ? '입금' : '지출'}
                </button>
              ))}
            </div>
            <Input label="금액" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            <Input label="내용" value={description} onChange={e => setDescription(e.target.value)} placeholder="예: 5월 정기회비 수납" />
            <input type="file" accept="image/*" ref={fileRef} onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C0392B] border border-dashed border-gray-300 rounded-lg p-2.5 hover:border-[#C0392B] transition-colors">
              <Receipt size={16} />{receiptFile ? receiptFile.name : '영수증 첨부 (선택)'}
            </button>
            {addError && <p className="text-xs text-red-500">{addError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>취소</Button>
              <Button className="flex-1" loading={addLoading} onClick={handleAdd}>저장</Button>
            </div>
          </div>
        )}

        {/* 내역 목록 */}
        <div className="flex flex-col gap-2">
          {list.length > 0 ? list.map((f: Finance) => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
              {isOwner && editingId === f.id ? (
                /* 인라인 수정 폼 */
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    {(['income', 'expense'] as FinanceType[]).map(t => (
                      <button key={t} onClick={() => setEditType(t)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors
                          ${editType === t ? 'border-[#C0392B] bg-[#FADBD8] text-[#C0392B]' : 'border-gray-200 text-gray-500'}`}>
                        {t === 'income' ? '입금' : '지출'}
                      </button>
                    ))}
                  </div>
                  <Input label="금액" type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                  <Input label="내용" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingId(null)}>
                      <X size={14} />취소
                    </Button>
                    <Button size="sm" className="flex-1" loading={editLoading} onClick={handleUpdate}>
                      <Check size={14} />저장
                    </Button>
                  </div>
                </div>
              ) : (
                /* 일반 뷰 */
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${f.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {f.type === 'income'
                      ? <TrendingUp size={18} className="text-green-600" />
                      : <TrendingDown size={18} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.description}</p>
                    <p className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <p className={`font-bold ${f.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {f.type === 'income' ? '+' : '-'}{fmt(f.amount)}
                      </p>
                      {f.receipt_url && (
                        <a href={f.receipt_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#C0392B] hover:underline">영수증</a>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(f)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="수정"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="mt-10 text-center text-gray-400 text-sm">등록된 내역이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}
