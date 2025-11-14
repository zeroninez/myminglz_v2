/**
 * 이벤트 생성/조회 API
 * POST /api/events - 이벤트 생성
 * GET /api/events - 이벤트 목록 조회
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 이벤트 생성
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
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
    const body = await request.json();

    // 필수 필드 검증
    const { name, domain_code, landing_pages } = body;
    if (!name || !domain_code) {
      return NextResponse.json(
        { success: false, error: '이벤트 이름과 도메인 코드는 필수입니다.' },
        { status: 400 }
      );
    }

    // 도메인 코드 중복 확인
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('domain_code', domain_code)
      .single();

    if (existingEvent) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 도메인 코드입니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션 시작 (Supabase는 트랜잭션을 직접 지원하지 않으므로 순차 실행)
    // 1. 이벤트 생성
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        name,
        domain_code,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        background_color: body.background_color || '#000000',
        description: body.description || null,
        content_html: body.content_html || null,
        coupon_preview_image_url: body.coupon_preview_image_url || null,
        mission_config: body.mission_config || null,
        event_info_config: body.event_info_config || null,
      })
      .select()
      .single();

    if (eventError) {
      console.error('이벤트 생성 오류:', eventError);
      return NextResponse.json(
        { success: false, error: '이벤트 생성에 실패했습니다.', details: eventError.message },
        { status: 500 }
      );
    }

    // 2. 랜딩 페이지 생성
    if (landing_pages && Array.isArray(landing_pages) && landing_pages.length > 0) {
      const landingPagesData = landing_pages.map((page: any, index: number) => ({
        event_id: event.id,
        page_number: page.page_number || index + 1,
        page_type: page.page_type || '기타',
        template_type: page.template_type || '유형1',
        background_color: page.background_color || '#000000',
      }));

      const { error: pagesError } = await supabase
        .from('landing_pages')
        .insert(landingPagesData);

      if (pagesError) {
        console.error('랜딩 페이지 생성 오류:', pagesError);
        // 이벤트는 이미 생성되었으므로 롤백 (수동 삭제)
        await supabase.from('events').delete().eq('id', event.id);
        return NextResponse.json(
          { success: false, error: '랜딩 페이지 생성에 실패했습니다.', details: pagesError.message },
          { status: 500 }
        );
      }

      // 3. 페이지 콘텐츠 생성
      const pageContentsData: any[] = [];
      
      for (const page of landing_pages) {
        if (page.contents && Array.isArray(page.contents)) {
          // 랜딩 페이지 ID 조회
          const { data: landingPage } = await supabase
            .from('landing_pages')
            .select('id')
            .eq('event_id', event.id)
            .eq('page_number', page.page_number || landing_pages.indexOf(page) + 1)
            .single();

          if (landingPage) {
            for (const content of page.contents) {
              pageContentsData.push({
                landing_page_id: landingPage.id,
                field_id: content.field_id,
                field_value: content.field_value || null,
                field_color: content.field_color || null,
                is_visible: content.is_visible !== false,
              });
            }
          }
        }
      }

      if (pageContentsData.length > 0) {
        const { error: contentsError } = await supabase
          .from('page_contents')
          .insert(pageContentsData);

        if (contentsError) {
          console.error('페이지 콘텐츠 생성 오류:', contentsError);
          // 부분 실패이지만 이벤트는 생성되었으므로 경고만
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { event_id: event.id, domain_code: event.domain_code },
      message: '이벤트가 성공적으로 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('이벤트 생성 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

// 이벤트 목록 조회
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
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

    // 사용자의 이벤트 목록 조회
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, domain_code, start_date, end_date, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('이벤트 조회 오류:', eventsError);
      return NextResponse.json(
        { success: false, error: '이벤트 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: events || [],
    });
  } catch (error: any) {
    console.error('이벤트 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

