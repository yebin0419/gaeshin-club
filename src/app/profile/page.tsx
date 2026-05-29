export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  const { data: membershipsRaw } = await supabase
    .from('club_members')
    .select('role, club:clubs(id, name, category)')
    .eq('user_id', user.id)

  const memberships = (membershipsRaw ?? []).map(m => ({
    role: m.role as string,
    club: Array.isArray(m.club) ? (m.club[0] ?? null) : (m.club as { id: string; name: string; category: string } | null),
  }))

  return <ProfileClient profile={profile} memberships={memberships} />
}
