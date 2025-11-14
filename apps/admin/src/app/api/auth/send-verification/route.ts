import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Supabase 클라이언트 생성 (일반)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Supabase Admin 클라이언트 생성 (Service Role Key 사용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log('📧 이메일 중복 확인:', email);

    // 이미 가입된 이메일인지 확인
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!checkError && existingUser?.users) {
      const userExists = existingUser.users.some(user => user.email === email);
      if (userExists) {
        console.log('❌ 이미 가입된 이메일:', email);
        return NextResponse.json(
          { success: false, error: '이미 가입된 이메일입니다.' },
          { status: 400 }
        );
      }
    }

    // 6자리 인증 코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log('📧 이메일 발송 시도:', email);

    // Resend로 실제 이메일 전송
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'MyMinglz 관리자 계정 인증 코드',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #000; font-size: 24px; font-weight: 600; margin: 0;">MyMinglz</h1>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
            <h2 style="color: #000; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">계정 인증 코드</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px 0;">관리자 계정 생성을 위한 인증 코드입니다.</p>
            
            <div style="background: #fff; border: 2px solid #e9ecef; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #000;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #999; font-size: 13px; margin: 24px 0 0 0;">
              이 코드는 <strong>10분간 유효</strong>합니다.
            </p>
          </div>
          
          <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              본인이 요청하지 않았다면 이 이메일을 무시하세요.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend 에러:', error);
      return NextResponse.json(
        { success: false, error: '이메일 전송에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 이메일 발송 성공:', data?.id);

    // Supabase에 인증 코드 저장 (10분 유효)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후
    
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error('DB 저장 실패:', dbError);
      // 이메일은 발송되었지만 DB 저장 실패 - 사용자에게는 성공으로 처리
    } else {
      console.log('✅ DB 저장 성공:', email);
    }

    return NextResponse.json({
      success: true,
      message: '인증 코드가 이메일로 전송되었습니다.',
    });
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    return NextResponse.json(
      { success: false, error: '이메일 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}

