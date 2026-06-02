export type UserRole = 'app_admin' | 'user'
export type UserStatus = 'pending' | 'approved' | 'rejected'
export type ClubMemberRole = 'owner' | 'staff' | 'member' | 'alumni'
export type PostType = 'notice' | 'general' | 'poll'
export type FinanceType = 'income' | 'expense'
export type ClubCategory = '교양' | '학술' | '문화' | '봉사' | '체육' | '종교'

export interface User {
  id: string
  email: string
  name: string
  department: string
  student_id: string
  role: UserRole
  status: UserStatus
  created_at: string
}

export interface Club {
  id: string
  name: string
  category: ClubCategory
  is_central: boolean
  description: string | null
  is_recruiting: boolean
  created_by: string
  created_at: string
}

export interface ClubMember {
  id: string
  club_id: string
  user_id: string
  role: ClubMemberRole
  joined_at: string
  user?: User
  club?: Club
}

export interface Post {
  id: string
  club_id: string
  author_id: string
  type: PostType
  is_pinned: boolean
  title: string
  content: string
  created_at: string
  updated_at: string
  author?: User
}

export interface PollOption {
  id: string
  post_id: string
  label: string
}

export interface PollResponse {
  id: string
  post_id: string
  user_id: string
  choice: string
  created_at: string
}

export interface SubGroup {
  id: string
  club_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Finance {
  id: string
  club_id: string
  type: FinanceType
  amount: number
  description: string
  receipt_url: string | null
  created_by: string
  created_at: string
}

export interface FeeCampaign {
  id: string
  club_id: string
  title: string
  target_amount: number
  due_date: string
  payer_ids: string[]
  created_at: string
}

export interface Archive {
  id: string
  club_id: string
  file_url: string
  title: string
  year: number
  generation: string
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export interface ClubApplication {
  id: string
  club_id: string
  user_id: string
  contact: string
  introduction?: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason: string | null
  created_at: string
  user?: User
  club?: Club
}
