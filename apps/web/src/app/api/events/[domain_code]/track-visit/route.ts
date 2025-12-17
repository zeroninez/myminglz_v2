/**
 * 페이지 방문 로그 기록 API
 * POST /api/events/[domain_code]/track-visit
 * 
 * 공개 API - 인증 불필요 (이벤트 랜딩 페이지 방문 추적용)
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ domain_code: string }> }
) {
  try {
    const resolvedParams = await params;
    const domainCode = resolvedParams.domain_code;
    
    if (!domainCode) {
      return NextResponse.json(
        { success: false, error: '도메인 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이벤트 조회 (도메인 코드로)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('domain_code', domainCode)
      .single();

    if (eventError || !event) {
      // 이벤트가 없어도 방문 로그는 기록하지 않음 (에러 반환)
      return NextResponse.json(
        { success: false, error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 요청 정보 추출
    const userAgent = request.headers.get('user-agent') || null;
    const referer = request.headers.get('referer') || null;
    
    // IP 주소 추출 (X-Forwarded-For 헤더 확인)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || null;

    // 방문 로그 저장
    const { error: insertError } = await supabase
      .from('page_visits')
      .insert({
        event_id: event.id,
        domain_code: domainCode,
        user_agent: userAgent,
        ip_address: ipAddress,
        referer: referer,
        visited_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('방문 로그 저장 오류:', insertError);
      // 에러가 발생해도 클라이언트에는 성공 응답 (방문 로그 실패가 페이지 로딩을 막지 않도록)
      return NextResponse.json({ success: true, warning: '방문 로그 저장에 실패했습니다.' });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('방문 로그 기록 중 오류:', error);
    // 에러가 발생해도 클라이언트에는 성공 응답
    return NextResponse.json({ success: true, warning: '방문 로그 기록 중 오류가 발생했습니다.' });
  }
}

