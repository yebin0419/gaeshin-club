export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FinanceClient from './FinanceClient'

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase.from('clubs').select('name').eq('id', id).single()
  if (!club) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: membership } = user
    ? await supabase.from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).single()
    : { data: null }

  const { data: finances } = await supabase
    .from('finances')
    .select('*')
    .eq('club_id', id)
    .order('created_at', { ascending: false })

  const balance = (finances ?? []).reduce((acc: number, f: { type: string; amount: number }) =>
    f.type === 'income' ? acc + f.amount : acc - f.amount, 0)

  const isStaff = membership?.role === 'owner' || membership?.role === 'staff'
  const isOwner = membership?.role === 'owner'

  return <FinanceClient clubId={id} clubName={club.name} finances={finances ?? []} balance={balance} isStaff={isStaff} isOwner={isOwner} />
}
