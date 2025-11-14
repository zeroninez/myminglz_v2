/**
 * 이벤트 상세 조회/수정/삭제 API
 * GET /api/events/[id] - 이벤트 상세 조회
 * PUT /api/events/[id] - 이벤트 수정
 * DELETE /api/events/[id] - 이벤트 삭제
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 이벤트 상세 조회 (랜딩 페이지 및 콘텐츠 포함)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // 이벤트 조회
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userData.user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 랜딩 페이지 조회
    const { data: landingPages, error: pagesError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('event_id', eventId)
      .order('page_number', { ascending: true });

    if (pagesError) {
      console.error('랜딩 페이지 조회 오류:', pagesError);
    }

    // 페이지 콘텐츠 조회
    const pageContents: Record<string, any[]> = {};
    
    if (landingPages && landingPages.length > 0) {
      const pageIds = landingPages.map((page) => page.id);
      
      const { data: contents, error: contentsError } = await supabase
        .from('page_contents')
        .select('*')
        .in('landing_page_id', pageIds);

      if (!contentsError && contents) {
        for (const content of contents) {
          if (!pageContents[content.landing_page_id]) {
            pageContents[content.landing_page_id] = [];
          }
          pageContents[content.landing_page_id].push(content);
        }
      }
    }

    // 데이터 구조화
    const formattedLandingPages = (landingPages || []).map((page) => ({
      ...page,
      contents: pageContents[page.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        landing_pages: formattedLandingPages,
      },
    });
  } catch (error: any) {
    console.error('이벤트 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 이벤트 수정
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const eventId = params.id;
    const body = await request.json();

    // 이벤트 소유권 확인
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', userData.user.id)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: '이벤트를 찾을 수 없거나 권한이 없습니다.' },
        { status: 404 }
      );
    }

    // 이벤트 정보 업데이트
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.domain_code) updateData.domain_code = body.domain_code;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.background_color) updateData.background_color = body.background_color;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.content_html !== undefined) updateData.content_html = body.content_html;
    if (body.coupon_preview_image_url !== undefined) updateData.coupon_preview_image_url = body.coupon_preview_image_url;
    if (body.mission_config !== undefined) updateData.mission_config = body.mission_config;
    if (body.event_info_config !== undefined) updateData.event_info_config = body.event_info_config;

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('이벤트 수정 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '이벤트 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 랜딩 페이지 업데이트 (필요한 경우)
    if (body.landing_pages && Array.isArray(body.landing_pages)) {
      // 기존 페이지 삭제 후 재생성 (간단한 방법)
      await supabase.from('landing_pages').delete().eq('event_id', eventId);

      const landingPagesData = body.landing_pages.map((page: any, index: number) => ({
        event_id: eventId,
        page_number: page.page_number || index + 1,
        page_type: page.page_type || '기타',
        template_type: page.template_type || '유형1',
        background_color: page.background_color || '#000000',
      }));

      const { data: newPages, error: pagesError } = await supabase
        .from('landing_pages')
        .insert(landingPagesData)
        .select();

      if (!pagesError && newPages && body.landing_pages) {
        // 페이지 콘텐츠 업데이트
        const pageContentsData: any[] = [];
        
        for (let i = 0; i < body.landing_pages.length; i++) {
          const page = body.landing_pages[i];
          const newPage = newPages[i];
          
          if (page.contents && Array.isArray(page.contents) && newPage) {
            for (const content of page.contents) {
              pageContentsData.push({
                landing_page_id: newPage.id,
                field_id: content.field_id,
                field_value: content.field_value || null,
                field_color: content.field_color || null,
                is_visible: content.is_visible !== false,
              });
            }
          }
        }

        if (pageContentsData.length > 0) {
          await supabase.from('page_contents').insert(pageContentsData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: '이벤트가 성공적으로 수정되었습니다.',
    });
  } catch (error: any) {
    console.error('이벤트 수정 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 이벤트 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // 이벤트 소유권 확인
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', userData.user.id)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: '이벤트를 찾을 수 없거나 권한이 없습니다.' },
        { status: 404 }
      );
    }

    // CASCADE로 인해 관련 데이터도 자동 삭제됨
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      console.error('이벤트 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: '이벤트 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 성공적으로 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('이벤트 삭제 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

