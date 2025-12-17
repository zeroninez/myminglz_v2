import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 토큰으로 사용자 정보 가져오기
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      // 토큰이 만료된 경우, refresh 토큰으로 갱신 시도
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (refreshError || !refreshData.session) {
          return NextResponse.json(
            { success: false, error: '세션이 만료되었습니다.' },
            { status: 401 }
          );
        }

        // 새 토큰 저장
        const response = NextResponse.json({
          success: true,
          user: {
            id: refreshData.user?.id,
            email: refreshData.user?.email,
            name: refreshData.user?.user_metadata?.name,
          },
        });

        response.cookies.set('sb-access-token', refreshData.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        response.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        return response;
      }

      return NextResponse.json(
        { success: false, error: '세션이 만료되었습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
    });
  } catch (error) {
    console.error('세션 확인 에러:', error);
    return NextResponse.json(
      { success: false, error: '세션 확인에 실패했습니다.' },
      { status: 500 }
    );
  }
}





