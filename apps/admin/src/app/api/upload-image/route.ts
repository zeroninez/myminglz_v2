import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.error('인증 토큰 없음');
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    // Supabase 클라이언트 생성 (세션 토큰 사용)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // 사용자 인증 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      console.error('인증 실패:', userError);
      return NextResponse.json({ 
        success: false, 
        error: `인증에 실패했습니다: ${userError?.message || 'Unknown error'}` 
      }, { status: 401 });
    }

    console.log('인증 성공, 사용자 ID:', user.id);

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('파일 없음');
      return NextResponse.json({ success: false, error: '파일이 없습니다.' }, { status: 400 });
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      console.error('잘못된 파일 타입:', file.type);
      return NextResponse.json({ success: false, error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('파일 크기 초과:', file.size);
      return NextResponse.json({ success: false, error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
    }

    // 파일명 생성 (타임스탬프 + 사용자 ID + 원본 파일명)
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `landing-pages/${fileName}`;

    console.log('파일 업로드 시도:', filePath, '크기:', file.size);

    // Supabase Storage에 업로드 (File 객체 직접 전달)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('이미지 업로드 오류:', uploadError);
      console.error('업로드 오류 상세:', JSON.stringify(uploadError, null, 2));
      
      // 에러 타입별 안내 메시지
      let errorMessage = uploadError.message || 'Unknown error';
      let hint = undefined;
      
      if (uploadError.message?.includes('new row violates row-level security') || uploadError.message?.includes('RLS')) {
        errorMessage = 'Storage 정책이 설정되지 않았거나 잘못되었습니다.';
        hint = 'Supabase Dashboard > Storage > Policies에서 정책을 확인하거나, supabase-storage-policies.sql을 실행하세요.';
      } else if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
        errorMessage = 'Storage bucket이 존재하지 않습니다.';
        hint = 'Supabase Dashboard > Storage > Create bucket (name: event-images)';
      } else if (uploadError.message?.includes('JWT') || uploadError.message?.includes('token')) {
        errorMessage = '인증 토큰 문제가 발생했습니다. 다시 로그인해주세요.';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `이미지 업로드에 실패했습니다: ${errorMessage}`,
          details: uploadError,
          hint: uploadError.message?.includes('new row violates row-level security') 
            ? 'Supabase Dashboard > Storage > Policies에서 정책을 설정하거나, supabase-storage-policies.sql을 실행하세요.'
            : undefined
        },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('이미지 업로드 예외:', error);
    console.error('예외 스택:', error?.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: `이미지 업로드 중 오류가 발생했습니다: ${error?.message || 'Unknown error'}`,
        details: error?.toString()
      },
      { status: 500 }
    );
  }
}

