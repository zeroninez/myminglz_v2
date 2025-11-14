import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('👋 로그아웃 시도');

    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });

    // 쿠키 삭제
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    console.log('✅ 로그아웃 성공');

    return response;
  } catch (error) {
    console.error('로그아웃 에러:', error);
    return NextResponse.json(
      { success: false, error: '로그아웃에 실패했습니다.' },
      { status: 500 }
    );
  }
}





