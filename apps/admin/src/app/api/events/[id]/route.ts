/**
 * 이벤트 상세 조회/수정/삭제 API
 * GET /api/events/[id] - 이벤트 상세 조회
 * PUT /api/events/[id] - 이벤트 수정
 * DELETE /api/events/[id] - 이벤트 삭제
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

// 이벤트 상세 조회 (랜딩 페이지 및 콘텐츠 포함)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 확인 (먼저 토큰 검증)
    const tempSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    const { data: userData, error: userError } = await tempSupabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    // 인증된 Supabase 클라이언트 생성 (RLS를 위해 Authorization 헤더 설정)
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
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const eventId = resolvedParams.id;

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

    // Stores 조회 (이벤트의 location과 연결된 stores)
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
        stores: stores, // Stores 정보 추가
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 확인 (먼저 토큰 검증)
    const tempSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    const { data: userData, error: userError } = await tempSupabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    // 인증된 Supabase 클라이언트 생성 (RLS를 위해 Authorization 헤더 설정)
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
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const eventId = resolvedParams.id;
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

    // Location 생성/업데이트 (쿠폰 발급을 위해)
    // domain_code나 name이 변경되었을 때 location도 업데이트
    const finalDomainCode = updatedEvent?.domain_code || body.domain_code;
    const finalName = updatedEvent?.name || body.name;
    
    if (finalDomainCode && finalName) {
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', finalDomainCode)
        .single();

      if (!existingLocation) {
        // Location이 없으면 생성 (name = 이벤트 이름, slug = domain_code)
        const { error: locationError } = await supabase
          .from('locations')
          .insert({
            name: finalName,
            slug: finalDomainCode,
            is_active: true, // CouponService에서 is_active로 필터링하므로 필수
            description: body.description || null,
          });

        if (locationError) {
          console.error('Location 생성 오류:', locationError);
        } else {
          console.log('✅ Location 자동 생성 성공:', { name: finalName, slug: finalDomainCode });
        }
      } else {
        // Location이 있으면 name 업데이트 (이벤트 이름 변경 시)
        if (body.name) {
          const { error: updateError } = await supabase
            .from('locations')
            .update({ name: finalName })
            .eq('slug', finalDomainCode);
          
          if (updateError) {
            console.error('Location name 업데이트 오류:', updateError);
          } else {
            console.log('Location name 업데이트 성공:', { slug: finalDomainCode, name: finalName });
          }
        }
      }
    }

    // Stores 생성/업데이트 (event_info_config.stores를 stores 테이블에 저장)
    if (finalDomainCode) {
      // Location ID 조회
      const { data: location } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', finalDomainCode)
        .single();

      if (location) {
        // 이벤트 주최 = 사용처인 경우, 도메인 코드로 store 자동 생성
        if (body.event_info_config?.is_host_same_as_store) {
          // 기존 stores 삭제 (이 이벤트의 location_id를 가진 stores 중 주최 store가 아닌 것들)
          await supabase
            .from('stores')
            .delete()
            .eq('location_id', location.id)
            .neq('slug', finalDomainCode); // 도메인 코드 store는 유지

          const storeName = finalName || '이벤트 주최처';
          const storeSlug = finalDomainCode; // 도메인 코드를 slug로 사용
          
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
            } else {
              console.log('✅ Store 자동 생성 성공 (주최=사용처):', storeSlug);
            }
          } else {
            // 기존 store 업데이트
            const { error: updateError } = await supabase
              .from('stores')
              .update({
                name: storeName,
                description: JSON.stringify({ is_host_store: true }),
                is_active: true,
              })
              .eq('id', existingStore.id);

            if (updateError) {
              console.error('Store 업데이트 오류 (주최=사용처):', updateError);
            } else {
              console.log('✅ Store 업데이트 성공 (주최=사용처):', storeSlug);
            }
          }
        } else if (body.event_info_config?.stores && Array.isArray(body.event_info_config.stores)) {
          // 일반적인 사용처 등록
          // 기존 stores 삭제 (이 이벤트의 location_id를 가진 stores)
          await supabase
            .from('stores')
            .delete()
            .eq('location_id', location.id);

          // 새 stores 생성
          const storesData = body.event_info_config.stores
            .filter((store: any) => store.name && store.name.trim()) // name이 있는 것만
            .map((store: any, index: number) => {
              const slug = generateSlugFromName(store.name, finalDomainCode, index);
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
            } else {
              console.log('✅ Stores 자동 생성/업데이트 성공:', storesData.length, '개');
            }
          }
        }
      } else {
        console.warn('Location을 찾을 수 없어 Stores를 생성할 수 없습니다.');
      }
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

// Storage 경로 추출 헬퍼 함수
function extractStoragePath(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Supabase Storage URL 형식: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const storageMatch = url.match(/\/storage\/v1\/object\/public\/event-images\/(.+)$/);
  if (storageMatch) {
    return storageMatch[1];
  }
  
  // 상대 경로인 경우 (이미 path만 있는 경우)
  if (url.startsWith('landing-pages/')) {
    return url;
  }
  
  return null;
}

// 이벤트 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 확인 (먼저 토큰 검증)
    const tempSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    const { data: userData, error: userError } = await tempSupabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    // 인증된 Supabase 클라이언트 생성 (RLS를 위해 Authorization 헤더 설정)
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
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const eventId = resolvedParams.id;

    // 이벤트 소유권 확인 및 domain_code 가져오기
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id, domain_code')
      .eq('id', eventId)
      .eq('user_id', userData.user.id)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: '이벤트를 찾을 수 없거나 권한이 없습니다.' },
        { status: 404 }
      );
    }

    // 관련 데이터 삭제 순서 (외래키 제약 조건 고려)
    
    // 0. 이미지 파일 삭제 (Storage에서)
    try {
      // 0-1. event_images 테이블에서 이미지 정보 조회
      const { data: eventImages } = await supabase
        .from('event_images')
        .select('image_url, image_path')
        .eq('event_id', eventId);

      // 0-2. landing_pages의 page_contents에서 이미지 URL 추출
      const { data: landingPages } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('event_id', eventId);

      const pageContentsWithImages: string[] = [];
      if (landingPages) {
        for (const page of landingPages) {
          const { data: contents } = await supabase
            .from('page_contents')
            .select('field_value')
            .eq('landing_page_id', page.id);
          
          if (contents) {
            contents.forEach(content => {
              if (content.field_value && typeof content.field_value === 'string') {
                // 이미지 URL 패턴 확인 (Storage URL 또는 일반 URL)
                if (content.field_value.includes('storage/v1/object/public/event-images/') || 
                    content.field_value.includes('.png') || 
                    content.field_value.includes('.jpg') || 
                    content.field_value.includes('.jpeg')) {
                  pageContentsWithImages.push(content.field_value);
                }
              }
            });
          }
        }
      }

      // 0-3. events 테이블의 coupon_preview_image_url 확인
      const { data: eventData } = await supabase
        .from('events')
        .select('coupon_preview_image_url')
        .eq('id', eventId)
        .single();

      // 0-4. 모든 이미지 경로 수집
      const imagePaths: string[] = [];
      
      // event_images의 image_path 또는 URL에서 경로 추출
      if (eventImages) {
        eventImages.forEach(img => {
          if (img.image_path) {
            imagePaths.push(img.image_path);
          } else if (img.image_url) {
            const path = extractStoragePath(img.image_url);
            if (path) imagePaths.push(path);
          }
        });
      }

      // page_contents의 이미지 URL에서 경로 추출
      pageContentsWithImages.forEach(url => {
        const path = extractStoragePath(url);
        if (path) imagePaths.push(path);
      });

      // coupon_preview_image_url에서 경로 추출
      if (eventData?.coupon_preview_image_url) {
        const path = extractStoragePath(eventData.coupon_preview_image_url);
        if (path) imagePaths.push(path);
      }

      // 0-5. 중복 제거 및 Storage에서 삭제
      const uniquePaths = [...new Set(imagePaths)];
      if (uniquePaths.length > 0) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const bucketName = 'event-images';
        
        // 각 이미지 파일 삭제
        for (const path of uniquePaths) {
          try {
            const { error: deleteImgError } = await supabase.storage
              .from(bucketName)
              .remove([path]);
            
            if (deleteImgError) {
              console.warn(`이미지 삭제 실패 (${path}):`, deleteImgError);
            } else {
              console.log(`이미지 삭제 성공: ${path}`);
            }
          } catch (imgError) {
            console.warn(`이미지 삭제 중 오류 (${path}):`, imgError);
          }
        }

      }
    } catch (imageDeleteError) {
      console.error('이미지 삭제 중 오류:', imageDeleteError);
      // 이미지 삭제 실패해도 계속 진행 (DB 삭제는 계속)
      }

    // 1. Page visits 삭제 (event_id로)
    await supabase
      .from('page_visits')
      .delete()
      .eq('event_id', eventId);

    // 2. Location 및 관련 데이터 삭제 (domain_code로 location 찾기)
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', existingEvent.domain_code)
      .single();

    if (location) {
      // 2-1. 해당 location의 coupons 삭제
      await supabase
        .from('coupons')
        .delete()
        .eq('location_id', location.id);

      // 2-2. 해당 location의 stores 삭제
      await supabase
        .from('stores')
        .delete()
        .eq('location_id', location.id);

      // 2-3. location 삭제
      await supabase
        .from('locations')
        .delete()
        .eq('id', location.id);
    }

    // 3. Events 삭제 (CASCADE로 landing_pages, page_contents, event_images 자동 삭제됨)
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

