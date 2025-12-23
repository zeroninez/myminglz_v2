import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DashboardNav from './DashboardNav';
import LogoutButton from './LogoutButton';

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
    redirect('/login');
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              MyMinglz {isAdmin ? '전체 관리자' : '관리자'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {displayName} 님, 환영합니다. {isAdmin && <span className="text-blue-600 font-semibold">[관리자]</span>}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <DashboardNav isAdmin={isAdmin} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}



