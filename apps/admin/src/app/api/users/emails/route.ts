import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// 사용자 ID 목록으로부터 이메일 조회 (관리자 전용)
export async function POST(request: Request) {
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

    const { userIds } = await request.json();

    console.log('사용자 이메일 조회 요청 - userIds:', userIds);

    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { success: false, error: 'userIds는 배열이어야 합니다.' },
        { status: 400 }
      );
    }

    const emailMap: Record<string, string> = {};
    
    // service_role 키가 있으면 Admin API 사용
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('SUPABASE_SERVICE_ROLE_KEY 존재 여부:', !!serviceRoleKey);
    
    if (serviceRoleKey) {
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

      // 각 userId에 대해 사용자 정보 조회
      for (const uid of userIds) {
        try {
          console.log(`사용자 ${uid} 이메일 조회 중...`);
          const { data: user, error: userErr } = await adminSupabase.auth.admin.getUserById(uid);
          
          if (userErr) {
            console.error(`사용자 ${uid} 조회 오류:`, userErr);
            continue;
          }
          
          if (user?.user?.email) {
            emailMap[uid] = user.user.email;
            console.log(`사용자 ${uid} 이메일: ${user.user.email}`);
          } else {
            console.warn(`사용자 ${uid}의 이메일을 찾을 수 없습니다.`, user);
          }
        } catch (error) {
          console.error(`사용자 ${uid} 이메일 조회 실패:`, error);
        }
      }
      
      console.log('이메일 맵:', emailMap);
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 사용자 이메일을 조회할 수 없습니다.');
    }

    return NextResponse.json({
      success: true,
      data: emailMap,
    });
  } catch (error: any) {
    console.error('사용자 이메일 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

