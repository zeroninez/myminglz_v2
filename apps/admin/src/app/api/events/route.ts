/**
 * 이벤트 생성/조회 API
 * POST /api/events - 이벤트 생성
 * GET /api/events - 이벤트 목록 조회
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Store name을 slug로 변환하는 함수
// 각 매장별 고유 slug 생성 (쿠폰 사용 추적을 위해)
function generateSlugFromName(name: string, domainCode: string, index: number): string {
  // 한글, 영문, 숫자, 공백을 허용하고 나머지는 제거
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-가-힣]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
  
  // slug가 비어있거나 한글이면 domain_code + index 사용
  if (!cleaned || /[가-힣]/.test(cleaned)) {
    return `${domainCode}-store-${index + 1}`;
  }
  
  // domain_code-store-name 형식으로 생성
  return `${domainCode}-${cleaned}`;
}

// 이벤트 생성
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
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

    // 1.5. Location 생성 (쿠폰 발급을 위해)
    // domain_code를 slug로 사용하여 location 생성
    // 이미 존재하는 경우는 건너뜀
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', domain_code)
      .single();

    if (!existingLocation) {
      // Location 생성 (쿠폰 발급을 위해)
      // name = 이벤트 이름, slug = domain_code
      const locationData: any = {
        name: name,
        slug: domain_code,
        description: body.description || null,
        is_active: true, // CouponService에서 is_active로 필터링하므로 필수
      };

      const { error: locationError } = await supabase
        .from('locations')
        .insert(locationData);

      if (locationError) {
        console.error('Location 생성 오류:', locationError);
        // Location 생성 실패해도 이벤트는 생성되었으므로 경고만
        console.warn('Location 생성에 실패했지만 이벤트는 생성되었습니다:', locationError.message);
      } else {
        console.log('✅ Location 자동 생성 성공:', { name, slug: domain_code });
      }
    } else {
      console.log('Location 이미 존재:', { slug: domain_code });
    }

    // 1.6. Stores 생성 (event_info_config.stores를 stores 테이블에 저장)
    // Location ID 조회 (방금 생성한 location 또는 기존 location)
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', domain_code)
      .single();

    if (location) {
      // 이벤트 주최 = 사용처인 경우, 도메인 코드로 store 자동 생성
      if (body.event_info_config?.is_host_same_as_store) {
        const storeName = body.name || '이벤트 주최처';
        const storeSlug = domain_code; // 도메인 코드를 slug로 사용
        
        // 기존 store가 있는지 확인
        const { data: existingStore } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', storeSlug)
          .eq('location_id', location.id)
          .single();

        if (!existingStore) {
          // Store 생성 (도메인 코드를 slug로 사용)
          const { error: storeError } = await supabase
            .from('stores')
            .insert({
              name: storeName,
              slug: storeSlug,
              location_id: location.id,
              description: JSON.stringify({ is_host_store: true }),
              is_active: true,
            });

          if (storeError) {
            console.error('Store 생성 오류 (주최=사용처):', storeError);
            console.warn('Store 생성에 실패했지만 이벤트는 생성되었습니다:', storeError.message);
          } else {
            console.log('✅ Store 자동 생성 성공 (주최=사용처):', storeSlug);
          }
        } else {
          console.log('Store 이미 존재 (주최=사용처):', storeSlug);
        }
      } else if (body.event_info_config?.stores && Array.isArray(body.event_info_config.stores) && body.event_info_config.stores.length > 0) {
        // 일반적인 사용처 등록
        const storesData = body.event_info_config.stores
          .filter((store: any) => store.name && store.name.trim()) // name이 있는 것만
          .map((store: any, index: number) => {
            const slug = generateSlugFromName(store.name, domain_code, index);
            // 임시 ID를 description에 JSON 형태로 저장 (slug와 함께 검증 가능하도록)
            const tempId = store.id || null;
            const descriptionText = store.benefit || store.description || null;
            // description에 임시 ID 정보 포함 (JSON 형태)
            const descriptionWithTempId = tempId 
              ? JSON.stringify({ tempId, description: descriptionText }) 
              : descriptionText;
            
            return {
              name: store.name.trim(),
              slug: slug,
              location_id: location.id,
              description: descriptionWithTempId,
              is_active: true,
            };
          });

        if (storesData.length > 0) {
          const { error: storesError } = await supabase
            .from('stores')
            .insert(storesData);

          if (storesError) {
            console.error('Stores 생성 오류:', storesError);
            console.warn('Stores 생성에 실패했지만 이벤트는 생성되었습니다:', storesError.message);
          } else {
            console.log('✅ Stores 자동 생성 성공:', storesData.length, '개');
          }
        }
      }
    } else {
      console.warn('Location을 찾을 수 없어 Stores를 생성할 수 없습니다.');
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
    const cookieStore = await cookies();
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
      .select('id, name, domain_code, start_date, end_date, event_info_config, created_at, updated_at')
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

