import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// 모든 사용자 목록 조회 (관리자 전용)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 인증된 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // 사용자 확인
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 관리자 권한 확인
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    const userRole = profileData?.role || 'user';
    const isAdmin = userRole === 'admin' || userData.user.email === 'admin@zeroninez.com';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // service_role 키로 모든 사용자 조회
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: '서버 설정이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 모든 사용자 목록 조회
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers();

    if (usersError) {
      console.error('사용자 목록 조회 오류:', usersError);
      return NextResponse.json(
        { success: false, error: '사용자 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // user_profiles에서 admin role을 가진 사용자 ID 목록 가져오기
    const { data: adminProfiles } = await adminSupabase
      .from('user_profiles')
      .select('user_id')
      .eq('role', 'admin');
    
    const adminUserIds = new Set((adminProfiles || []).map(p => p.user_id));
    
    // admin이 아닌 사용자만 필터링
    const users = (usersData?.users || [])
      .filter((user) => !adminUserIds.has(user.id))
      .map((user) => ({
        id: user.id,
        email: user.email || '',
      }));
    
    console.log(`전체 사용자: ${usersData?.users?.length || 0}, Admin 제외 후: ${users.length}`);

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('사용자 목록 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

