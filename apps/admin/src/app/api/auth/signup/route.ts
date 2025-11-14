import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    console.log('📝 회원가입 시도:', email);

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // 사용자 메타데이터에 회사명 저장
          company_name: name, // 회사명으로 명시적 저장
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/login`,
      },
    });

    if (authError) {
      console.error('❌ 회원가입 실패:', authError);
      return NextResponse.json(
        { 
          success: false, 
          error: authError.message === 'User already registered' 
            ? '이미 가입된 이메일입니다.' 
            : '회원가입에 실패했습니다.' 
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: '사용자 생성에 실패했습니다.' },
        { status: 400 }
      );
    }

    console.log('✅ 회원가입 성공:', authData.user.id);

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    return NextResponse.json(
      { success: false, error: '회원가입에 실패했습니다.' },
      { status: 500 }
    );
  }
}

