import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('🔑 로그인 시도:', email);

    // Supabase Auth로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ 로그인 실패:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message === 'Invalid login credentials' 
            ? '이메일 또는 비밀번호가 올바르지 않습니다.' 
            : '로그인에 실패했습니다.' 
        },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { success: false, error: '로그인에 실패했습니다.' },
        { status: 401 }
      );
    }

    console.log('✅ 로그인 성공:', data.user.id);

    // user_profiles에서 role 가져오기
    let userRole = 'user';
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();
    userRole = profile?.role || 'user';

    // 세션 토큰을 쿠키에 저장
    const response = NextResponse.json({
      success: true,
      message: '로그인되었습니다.',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        role: userRole,
      },
    });

    // Supabase 세션 토큰 쿠키에 저장 (7일 유효)
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('로그인 에러:', error);
    return NextResponse.json(
      { success: false, error: '로그인에 실패했습니다.' },
      { status: 500 }
    );
  }
}





