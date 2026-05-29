-- ============================================================
-- 개신클럽 Supabase 스키마
-- Supabase SQL Editor에서 순서대로 실행하세요.
-- ============================================================

-- 1. users (auth.users와 1:1 연결)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  department text not null,
  student_id text not null,
  role text not null default 'user' check (role in ('app_admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  student_id_url text,
  created_at timestamptz not null default now()
);

-- 2. clubs
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('교양', '학술', '문화', '봉사', '체육', '종교')),
  is_central boolean not null default false,
  description text,
  is_recruiting boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- 3. club_members
create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'staff', 'member', 'alumni')),
  joined_at timestamptz not null default now(),
  unique(club_id, user_id)
);

-- 4. club_applications
create table public.club_applications (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  contact text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  created_at timestamptz not null default now()
);

-- 5. posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  type text not null default 'general' check (type in ('notice', 'general', 'poll')),
  is_pinned boolean not null default false,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. poll_responses
create table public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  choice text not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

-- 7. sub_groups
create table public.sub_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 8. finances
create table public.finances (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount integer not null,
  description text not null,
  receipt_url text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- 9. fee_campaigns
create table public.fee_campaigns (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  target_amount integer not null default 0,
  due_date date,
  payer_ids uuid[] default '{}',
  created_at timestamptz not null default now()
);

-- 10. archives
create table public.archives (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  file_url text not null,
  title text not null,
  year integer not null,
  generation text,
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- 11. notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 12. owner_requests (방장 신청)
create table public.owner_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  club_name text not null,
  category text,
  description text,
  type text not null check (type in ('central', 'new')),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table public.users enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_applications enable row level security;
alter table public.posts enable row level security;
alter table public.poll_responses enable row level security;
alter table public.sub_groups enable row level security;
alter table public.finances enable row level security;
alter table public.archives enable row level security;
alter table public.notifications enable row level security;
alter table public.fee_campaigns enable row level security;
alter table public.owner_requests enable row level security;

-- users: 본인 레코드만 읽기/쓰기, 관리자 전체 접근
create policy "users_self" on public.users for all using (auth.uid() = id);
create policy "users_admin" on public.users for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'app_admin')
);

-- clubs: 승인된 유저 전체 읽기, 생성은 누구나(관리자 승인 후 반영)
create policy "clubs_read" on public.clubs for select using (
  exists (select 1 from public.users where id = auth.uid() and status = 'approved')
);
create policy "clubs_insert" on public.clubs for insert with check (auth.uid() is not null);

-- club_members: 해당 동아리 멤버만 읽기
create policy "members_read" on public.club_members for select using (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid())
);
create policy "members_insert" on public.club_members for insert with check (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid() and cm.role in ('owner', 'staff'))
);
create policy "members_update" on public.club_members for update using (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid() and cm.role = 'owner')
);

-- posts: 해당 동아리 멤버만 읽기/쓰기
create policy "posts_read" on public.posts for select using (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid())
);
create policy "posts_insert" on public.posts for insert with check (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid())
);

-- finances: 해당 동아리 멤버만 읽기, 임원진 이상만 쓰기
create policy "finances_read" on public.finances for select using (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid())
);
create policy "finances_insert" on public.finances for insert with check (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid() and cm.role in ('owner', 'staff'))
);

-- notifications: 본인 것만
create policy "notifications_self" on public.notifications for all using (user_id = auth.uid());

-- club_applications: 신청자 본인 or 해당 동아리 방장/임원진
create policy "applications_self" on public.club_applications for insert with check (user_id = auth.uid());
create policy "applications_read" on public.club_applications for select using (
  user_id = auth.uid() or
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid() and cm.role in ('owner', 'staff'))
);
create policy "applications_update" on public.club_applications for update using (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid() and cm.role in ('owner', 'staff'))
);

-- archives: 동아리 멤버
create policy "archives_read" on public.archives for select using (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid())
);
create policy "archives_insert" on public.archives for insert with check (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid())
);

-- ============================================================
-- 중앙동아리 시드 데이터 (50개)
-- ============================================================

insert into public.clubs (name, category, is_central, is_recruiting) values
  ('다이다이', '교양', true, true), ('Roll Dice', '교양', true, true), ('Youth Culture', '교양', true, true),
  ('AVES', '학술', true, true), ('가온', '학술', true, true), ('한별', '학술', true, true), ('보이는소리', '학술', true, true), ('VITALL', '학술', true, true),
  ('SIVA CREW', '문화', true, true), ('극예술 연구회 (시네씨아)', '문화', true, true), ('꼴로르', '문화', true, true),
  ('민속연구회', '문화', true, true), ('블랙홀', '문화', true, true), ('소용돌이', '문화', true, true), ('소울로직', '문화', true, true),
  ('아르페지오', '문화', true, true), ('징검다리사진반', '문화', true, true), ('창문학동인회', '문화', true, true),
  ('푸른소리', '문화', true, true), ('홀리보이스', '문화', true, true), ('폴리포니', '문화', true, true),
  ('RHEIN Philharmonic', '문화', true, true), ('늘해랑', '문화', true, true), ('어뮤즈먼트', '문화', true, true),
  ('RCY', '봉사', true, true), ('로타랙트', '봉사', true, true), ('어울림', '봉사', true, true),
  ('위더스', '봉사', true, true), ('ADOZ in Green On', '봉사', true, true), ('아이펫츄', '봉사', true, true),
  ('타우루스', '체육', true, true), ('바이펙스', '체육', true, true), ('화랑검우회', '체육', true, true),
  ('물밑세상', '체육', true, true), ('반쪽날개', '체육', true, true), ('수영사랑', '체육', true, true),
  ('콕콕', '체육', true, true), ('태극태권도연구회', '체육', true, true), ('페가수스', '체육', true, true),
  ('푸른밀가루', '체육', true, true), ('엣지', '체육', true, true), ('Light Weight', '체육', true, true), ('북두칠성', '체육', true, true),
  ('C.C.C', '종교', true, true), ('I.V.F', '종교', true, true), ('I.Y.F', '종교', true, true),
  ('SFC', '종교', true, true), ('가톨릭학생회', '종교', true, true), ('불교학생회', '종교', true, true), ('네비게이토', '종교', true, true);

-- ============================================================
-- Storage 버킷 생성 (Supabase 대시보드 Storage에서 직접 생성하거나 아래 SQL 사용)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('student-ids', 'student-ids', false);
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true);
-- insert into storage.buckets (id, name, public) values ('archives', 'archives', true);
