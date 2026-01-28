import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// 이벤트 홈 전용 통계 데이터 조회 (최적화된 버전)
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
    
    // URL 파라미터에서 이벤트 ID 목록 가져오기
    const url = new URL(request.url);
    const eventIdsParam = url.searchParams.get('eventIds');
    
    if (!eventIdsParam) {
      return NextResponse.json(
        { success: false, error: '이벤트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const eventIds = eventIdsParam.split(',');
    
    // 오늘과 어제 날짜 계산
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 모든 이벤트의 통계를 한 번에 조회
    const statsPromises = eventIds.map(async (eventId) => {
      try {
        // 이벤트 정보와 location 정보를 함께 조회
        const { data: event } = await supabase
          .from('events')
          .select('domain_code')
          .eq('id', eventId)
          .single();

        if (!event) {
          console.warn(`이벤트 ${eventId}를 찾을 수 없습니다.`);
          return {
            id: eventId,
            totalInflow: 0,
            couponIssued: 0,
            couponUsed: 0,
            totalInflowToday: 0,
            totalInflowYesterday: 0,
            couponIssuedToday: 0,
            couponIssuedYesterday: 0,
            couponUsedToday: 0,
            couponUsedYesterday: 0,
          };
        }

        // location 조회 (쿠폰 데이터를 위해 필요)
        const { data: location } = await supabase
          .from('locations')
          .select('id')
          .eq('domain_code', event.domain_code)
          .single();

        // 방문 수 조회 (page_visits 테이블 사용, event_id 기준)
        const [allVisitsResult, todayVisitsResult, yesterdayVisitsResult] = await Promise.all([
          // 전체 방문 수
          supabase
            .from('page_visits')
            .select('visited_at', { count: 'exact' })
            .eq('event_id', eventId),
          
          // 오늘 방문 수
          supabase
            .from('page_visits')
            .select('visited_at', { count: 'exact' })
            .eq('event_id', eventId)
            .gte('visited_at', `${todayStr}T00:00:00.000Z`)
            .lt('visited_at', `${todayStr}T23:59:59.999Z`),
          
          // 어제 방문 수
          supabase
            .from('page_visits')
            .select('visited_at', { count: 'exact' })
            .eq('event_id', eventId)
            .gte('visited_at', `${yesterdayStr}T00:00:00.000Z`)
            .lt('visited_at', `${yesterdayStr}T23:59:59.999Z`)
        ]);

        // 쿠폰 데이터 조회 (location이 있는 경우에만)
        let allCouponsResult: any = { data: null, count: 0 };
        let todayCouponsResult: any = { data: null, count: 0 };
        let yesterdayCouponsResult: any = { data: null, count: 0 };

        if (location) {
          const couponResults = await Promise.all([
            // 전체 쿠폰
            supabase
              .from('coupons')
              .select('created_at, is_used, used_at', { count: 'exact' })
              .eq('location_id', location.id),
            
            // 오늘 쿠폰
            supabase
              .from('coupons')
              .select('created_at, is_used, used_at', { count: 'exact' })
              .eq('location_id', location.id)
              .gte('created_at', `${todayStr}T00:00:00.000Z`)
              .lt('created_at', `${todayStr}T23:59:59.999Z`),
            
            // 어제 쿠폰
            supabase
              .from('coupons')
              .select('created_at, is_used, used_at', { count: 'exact' })
              .eq('location_id', location.id)
              .gte('created_at', `${yesterdayStr}T00:00:00.000Z`)
              .lt('created_at', `${yesterdayStr}T23:59:59.999Z`)
          ]);

          [allCouponsResult, todayCouponsResult, yesterdayCouponsResult] = couponResults;
        }

        // 통계 계산
        const calculateStats = (visitsResult: any, couponsResult: any) => {
          const totalInflow = visitsResult.count || (visitsResult.data ? visitsResult.data.length : 0);
          const couponIssued = couponsResult.count || (couponsResult.data ? couponsResult.data.length : 0);
          const couponUsed = couponsResult.data ? couponsResult.data.filter((c: any) => c.is_used).length : 0;
          
          return { totalInflow, couponIssued, couponUsed };
        };

        const allStats = calculateStats(allVisitsResult, allCouponsResult);
        const todayStats = calculateStats(todayVisitsResult, todayCouponsResult);
        const yesterdayStats = calculateStats(yesterdayVisitsResult, yesterdayCouponsResult);

        return {
          id: eventId,
          totalInflow: allStats.totalInflow,
          couponIssued: allStats.couponIssued,
          couponUsed: allStats.couponUsed,
          totalInflowToday: todayStats.totalInflow,
          totalInflowYesterday: yesterdayStats.totalInflow,
          couponIssuedToday: todayStats.couponIssued,
          couponIssuedYesterday: yesterdayStats.couponIssued,
          couponUsedToday: todayStats.couponUsed,
          couponUsedYesterday: yesterdayStats.couponUsed,
        };
      } catch (error) {
        console.error(`이벤트 ${eventId} 통계 조회 오류:`, error);
        return {
          id: eventId,
          totalInflow: 0,
          couponIssued: 0,
          couponUsed: 0,
          totalInflowToday: 0,
          totalInflowYesterday: 0,
          couponIssuedToday: 0,
          couponIssuedYesterday: 0,
          couponUsedToday: 0,
          couponUsedYesterday: 0,
        };
      }
    });

    const statsResults = await Promise.all(statsPromises);
    
    console.log('이벤트 홈 통계 결과:', {
      eventIds,
      resultsCount: statsResults.length,
      sampleResult: statsResults[0]
    });
    
    return NextResponse.json({
      success: true,
      data: statsResults,
    });

  } catch (error) {
    console.error('이벤트 홈 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '통계 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}