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
    
    // 오늘과 어제 날짜 계산 (한국 시간 기준)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const kstNow = new Date(now.getTime() + kstOffset);
    
    const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // UTC 기준으로 변환하여 데이터베이스 쿼리에 사용
    const todayUtcStart = new Date(today.getTime() - kstOffset);
    const todayUtcEnd = new Date(todayUtcStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const yesterdayUtcStart = new Date(yesterday.getTime() - kstOffset);
    const yesterdayUtcEnd = new Date(yesterdayUtcStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const todayStr = todayUtcStart.toISOString().split('T')[0];
    const yesterdayStr = yesterdayUtcStart.toISOString().split('T')[0];

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
          
          // 오늘 방문 수 (한국 시간 기준)
          supabase
            .from('page_visits')
            .select('visited_at', { count: 'exact' })
            .eq('event_id', eventId)
            .gte('visited_at', todayUtcStart.toISOString())
            .lt('visited_at', todayUtcEnd.toISOString()),
          
          // 어제 방문 수 (한국 시간 기준)
          supabase
            .from('page_visits')
            .select('visited_at', { count: 'exact' })
            .eq('event_id', eventId)
            .gte('visited_at', yesterdayUtcStart.toISOString())
            .lt('visited_at', yesterdayUtcEnd.toISOString())
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
            
            // 오늘 쿠폰 (한국 시간 기준)
            supabase
              .from('coupons')
              .select('created_at, is_used, used_at', { count: 'exact' })
              .eq('location_id', location.id)
              .gte('created_at', todayUtcStart.toISOString())
              .lt('created_at', todayUtcEnd.toISOString()),
            
            // 어제 쿠폰 (한국 시간 기준)
            supabase
              .from('coupons')
              .select('created_at, is_used, used_at', { count: 'exact' })
              .eq('location_id', location.id)
              .gte('created_at', yesterdayUtcStart.toISOString())
              .lt('created_at', yesterdayUtcEnd.toISOString())
          ]);

          [allCouponsResult, todayCouponsResult, yesterdayCouponsResult] = couponResults;
        }

        // 통계 계산 (한국 시간 기준)
        const calculateStats = (visitsResult: any, couponsResult: any, dateRange?: { start: Date, end: Date }) => {
          const totalInflow = visitsResult.count || (visitsResult.data ? visitsResult.data.length : 0);
          const couponIssued = couponsResult.count || (couponsResult.data ? couponsResult.data.length : 0);
          
          let couponUsed = 0;
          if (couponsResult.data) {
            if (dateRange) {
              // 특정 날짜 범위의 사용 수 (used_at 기준, 한국 시간)
              couponUsed = couponsResult.data.filter((c: any) => {
                if (!c.is_used || !c.used_at) return false;
                const usedDate = new Date(c.used_at);
                return usedDate >= dateRange.start && usedDate < dateRange.end;
              }).length;
            } else {
              // 전체 사용 수
              couponUsed = couponsResult.data.filter((c: any) => c.is_used).length;
            }
          }
          
          return { totalInflow, couponIssued, couponUsed };
        };

        const allStats = calculateStats(allVisitsResult, allCouponsResult);
        const todayStats = calculateStats(todayVisitsResult, allCouponsResult, { start: todayUtcStart, end: todayUtcEnd });
        const yesterdayStats = calculateStats(yesterdayVisitsResult, allCouponsResult, { start: yesterdayUtcStart, end: yesterdayUtcEnd });

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