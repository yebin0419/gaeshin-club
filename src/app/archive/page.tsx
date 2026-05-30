export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import ArchiveClient from './ArchiveClient'
import { Club } from '@/types'

export default async function ArchivePage() {
  const supabase = await createClient()
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*')
    .order('name')

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">기록실</h2>
        <p className="text-sm text-gray-500 mt-0.5">동아리별 연도별 활동 기록을 열람하세요</p>
      </div>
      <ArchiveClient clubs={(clubs as Club[]) ?? []} />
    </div>
  )
}
