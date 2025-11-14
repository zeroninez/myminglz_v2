import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    console.log('🔍 인증 시도:', email, code);

    // Supabase에서 인증 코드 조회
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('❌ 코드 검증 실패:', error);
      return NextResponse.json(
        { success: false, error: '잘못된 인증 코드이거나 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 인증 코드 사용 처리
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', data.id);

    if (updateError) {
      console.error('⚠️ 코드 사용 처리 실패:', updateError);
    }

    console.log('✅ 인증 성공:', email);

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
    });
  } catch (error) {
    console.error('인증 실패:', error);
    return NextResponse.json(
      { success: false, error: '인증에 실패했습니다.' },
      { status: 500 }
    );
  }
}


