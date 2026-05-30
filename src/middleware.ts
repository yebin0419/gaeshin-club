import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/signup', '/pending']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  // 비로그인 유저 → 로그인 페이지
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 로그인 유저가 /login, /signup 접근 시 → 홈
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // 로그인 유저 중 비공개 경로 접근 시 verification_status 확인
  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('users')
      .select('status, role')
      .eq('id', user.id)
      .single()

    const status = profile?.status

    // approved가 아닌 경우(pending, rejected, null 모두) /pending으로 차단
    if (status !== 'approved') {
      return NextResponse.redirect(new URL('/pending', request.url))
    }

    // 관리자 전용 라우트
    if (pathname.startsWith('/admin') && profile?.role !== 'app_admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
