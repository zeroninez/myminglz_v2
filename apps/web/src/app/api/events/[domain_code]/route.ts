/**
 * 도메인 코드로 이벤트 조회 API
 * GET /api/events/[domain_code]
 * 
 * 공개 API - 인증 불필요 (이벤트 랜딩 페이지용)
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain_code: string }> }
) {
  try {
    const resolvedParams = await params;
    const domainCode = resolvedParams.domain_code;
    
    console.log('🔍 API 호출 - domain_code:', domainCode);

    if (!domainCode) {
      return NextResponse.json(
        { success: false, error: '도메인 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 이벤트 조회 (도메인 코드로)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('domain_code', domainCode)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 랜딩 페이지 조회
    const { data: landingPages, error: pagesError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('event_id', event.id)
      .order('page_number', { ascending: true });

    if (pagesError) {
      console.error('랜딩 페이지 조회 오류:', pagesError);
    }

    console.log('📄 조회된 랜딩 페이지:', landingPages);

    // 3. 페이지 콘텐츠 조회
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

    console.log('📝 페이지 콘텐츠:', pageContents);

    // 4. 데이터 구조화
    const formattedLandingPages = (landingPages || []).map((page) => ({
      ...page,
      contents: pageContents[page.id] || [],
    }));

    console.log('✅ 최종 포맷된 랜딩 페이지:', formattedLandingPages);

    // 4. Stores 조회 (이벤트의 location과 연결된 stores)
    let stores: any[] = [];
    if (event.domain_code) {
      // Location 조회 (domain_code가 location slug)
      const { data: location } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', event.domain_code)
        .single();

      if (location) {
        // 해당 location의 stores 조회
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, name, slug, location_id, description, is_active')
          .eq('location_id', location.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!storesError && storesData) {
          stores = storesData;
          console.log('✅ Stores 조회 성공:', stores.length, '개');
        } else if (storesError) {
          console.error('Stores 조회 오류:', storesError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        landing_pages: formattedLandingPages,
        stores: stores, // stores 정보 추가
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

