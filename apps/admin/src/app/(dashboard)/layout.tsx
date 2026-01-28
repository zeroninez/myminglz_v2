import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DashboardNav from './DashboardNav';
import HeaderActions from './HeaderActions';
import EventsProviderWrapper from './EventsProviderWrapper';
import TokenRefresher from '@/components/TokenRefresher';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  if (!accessToken) {
    redirect('/login');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 환경변수가 설정되지 않았습니다.');
    redirect('/login');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    // 토큰이 만료된 경우 refresh 토큰으로 갱신 시도
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    if (refreshToken) {
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (refreshError || !refreshData.session) {
          redirect('/login');
        }

        // 새 토큰으로 사용자 정보 다시 가져오기
        const { data: newData, error: newError } = await supabase.auth.getUser(refreshData.session.access_token);
        if (newError || !newData.user) {
          redirect('/login');
        }

        // 새 토큰을 쿠키에 저장하는 것은 클라이언트 사이드에서 처리
        // 여기서는 현재 요청에 대해서만 새 사용자 데이터 사용
        data.user = newData.user;
      } catch (refreshError) {
        console.error('토큰 갱신 실패:', refreshError);
        redirect('/login');
      }
    } else {
      redirect('/login');
    }
  }

  const user = data.user;
  
  // user_profiles에서 role 가져오기
  let userRole = 'user';
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  userRole = profile?.role || 'user';

  const isAdmin = userRole === 'admin' || user.email === 'admin@zeroninez.com';
  
  const displayName =
    (user.user_metadata?.company_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    '사용자';

  return (
    <div className="min-h-screen bg-white w-full">
      <header className="shadow-sm w-full" style={{ backgroundColor: '#414B55' }}>
        <div className="flex items-center justify-between px-6 py-4 w-full max-w-none">
          <div>
            <h1 className="text-2xl font-bold text-white">
              myminglz
            </h1>
          </div>
          <HeaderActions displayName={displayName} />
        </div>
      </header>

      <div className="flex w-full max-w-none">
        <DashboardNav isAdmin={isAdmin} />

        <main className="flex-1 w-full min-w-0 max-w-none">
          <TokenRefresher />
          <EventsProviderWrapper>
            {children}
          </EventsProviderWrapper>
        </main>
      </div>
    </div>
  );
}



