export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FinanceClient from './FinanceClient'

const ADMIN_ROLES = ['app_admin', 'admin']

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase.from('clubs').select('name').eq('id', id).single()
  if (!club) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const [membershipRes, userDataRes] = user
    ? await Promise.all([
        supabase.from('club_members').select('role').eq('club_id', id).eq('user_id', user.id).single(),
        supabase.from('users').select('role').eq('id', user.id).single(),
      ])
    : [{ data: null }, { data: null }]

  const membership = membershipRes.data
  const isGlobalAdmin = ADMIN_ROLES.includes(userDataRes.data?.role ?? '')

  const { data: finances } = await supabase
    .from('finances')
    .select('*')
    .eq('club_id', id)
    .order('created_at', { ascending: false })

  const balance = (finances ?? []).reduce((acc: number, f: { type: string; amount: number }) =>
    f.type === 'income' ? acc + f.amount : acc - f.amount, 0)

  const isStaff = isGlobalAdmin || membership?.role === 'owner' || membership?.role === '총무'
  const isOwner = isGlobalAdmin || membership?.role === 'owner'

  return <FinanceClient clubId={id} clubName={club.name} finances={finances ?? []} balance={balance} isStaff={isStaff} isOwner={isOwner} />
}
