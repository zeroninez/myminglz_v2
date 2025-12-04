/**
 * 도메인 코드 중복 확인 API
 * GET /api/events/check-domain-code?code={domain_code}
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainCode = searchParams.get('code');

    if (!domainCode || !domainCode.trim()) {
      return NextResponse.json(
        { success: false, available: false, error: '도메인 코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, available: false, error: '인증이 필요합니다.' },
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
        { success: false, available: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const trimmedCode = domainCode.trim();

    // 도메인 코드 중복 확인
    const { data: existingEvent, error } = await supabase
      .from('events')
      .select('id')
      .eq('domain_code', trimmedCode)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 (데이터가 없는 경우) - 정상
      console.error('도메인 코드 확인 오류:', error);
      return NextResponse.json(
        { success: false, available: false, error: '도메인 코드 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // existingEvent가 있으면 중복, 없으면 사용 가능
    const isAvailable = !existingEvent;

    return NextResponse.json({
      success: true,
      available: isAvailable,
      message: isAvailable
        ? '사용 가능한 도메인 코드입니다.'
        : '이미 사용 중인 도메인 코드입니다.',
    });
  } catch (error: any) {
    console.error('도메인 코드 확인 오류:', error);
    return NextResponse.json(
      { success: false, available: false, error: error.message || '도메인 코드 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

