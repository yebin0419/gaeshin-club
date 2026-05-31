'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateBoardList(clubId: string) {
  revalidatePath(`/clubs/${clubId}/board`)
}
