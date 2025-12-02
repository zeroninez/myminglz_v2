import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// 통계 데이터 조회
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
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const period = searchParams.get('period') || 'today';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 날짜 범위 계산
    let dateRange: { start: Date; end: Date } | null = null;
    const now = new Date();
    
    if (period === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      dateRange = {
        start: new Date(yesterday.setHours(0, 0, 0, 0)),
        end: new Date(yesterday.setHours(23, 59, 59, 999)),
      };
    } else if (period === 'today') {
      dateRange = {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (period === 'thisWeek') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      dateRange = {
        start: new Date(startOfWeek.setHours(0, 0, 0, 0)),
        end: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (period === 'thisMonth') {
      dateRange = {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.setHours(23, 59, 59, 999)),
      };
    }

    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    // 이벤트 목록 가져오기 (필터 조건)
    let query = supabase
      .from('events')
      .select('id, name, domain_code, start_date, end_date, created_at')
      .eq('user_id', userId);

    if (eventId && eventId !== '전체') {
      query = query.eq('id', eventId);
    }

    const { data: events, error: eventsError } = await query.order('created_at', { ascending: false });

    if (eventsError) {
      console.error('이벤트 조회 오류:', eventsError);
      return NextResponse.json(
        { success: false, error: '이벤트 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 이벤트별 통계 데이터 계산
    const eventsWithStats = await Promise.all(
      (events || []).map(async (event) => {
        // event의 domain_code를 location slug로 사용하여 location 찾기
        const { data: location } = await supabase
          .from('locations')
          .select('id')
          .eq('slug', event.domain_code)
          .single();

        // 유입 수 조회 (페이지 방문 로그)
        let visitQuery = supabase
          .from('page_visits')
          .select('visited_at')
          .eq('event_id', event.id);

        if (dateRange) {
          visitQuery = visitQuery
            .gte('visited_at', dateRange.start.toISOString())
            .lte('visited_at', dateRange.end.toISOString());
        }

        const { data: visits, error: visitsError } = await visitQuery;

        if (visitsError) {
          console.error('방문 로그 조회 오류:', visitsError);
        }

        const visitList = visits || [];
        const totalInflow = visitList.length;

        if (!location) {
          // 시간대별 유입 수 집계
          const hourlyInflow = Array.from({ length: 24 }, (_, i) => {
            const hour = i;
            const hourStart = hour;
            const hourEnd = hour === 23 ? 24 : hour + 1;

            const inflow = visitList.filter((v) => {
              const visitDate = new Date(v.visited_at);
              const visitHour = visitDate.getHours();
              return visitHour >= hourStart && visitHour < hourEnd;
            }).length;

            return {
              hour: `${hour}시`,
              inflow,
              issuance: 0,
              usage: 0,
            };
          });

          return {
            id: event.id,
            name: event.name,
            domainCode: event.domain_code,
            conversionRate: 0,
            totalInflow,
            couponIssued: 0,
            couponUsed: 0,
            hourlyData: hourlyInflow,
            storeStats: [],
          };
        }

        // 쿠폰 발급 수 조회 (날짜 범위 필터 적용)
        let couponQuery = supabase
          .from('coupons')
          .select('id, created_at, is_used, used_at', { count: 'exact' })
          .eq('location_id', location.id);

        if (dateRange) {
          couponQuery = couponQuery
            .gte('created_at', dateRange.start.toISOString())
            .lte('created_at', dateRange.end.toISOString());
        }

        const { data: coupons, error: couponsError } = await couponQuery;

        if (couponsError) {
          console.error('쿠폰 조회 오류:', couponsError);
        }

        const couponList = coupons || [];
        const couponIssued = couponList.length;
        const couponUsed = couponList.filter((c) => c.is_used).length;
        const conversionRate = couponIssued > 0 ? Math.round((couponUsed / couponIssued) * 100 * 100) / 100 : 0;

        // Store별 검증 통계 조회
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id, name, slug')
          .eq('location_id', location.id)
          .eq('is_active', true);

        const storeList = stores || [];
        
        // Store별 검증 수 집계
        const storeStats = await Promise.all(
          storeList.map(async (store) => {
            // 해당 store에서 검증된 쿠폰 조회 (validated_by_store_id)
            let validatedCouponQuery = supabase
              .from('coupons')
              .select('validated_at')
              .eq('validated_by_store_id', store.id)
              .not('validated_at', 'is', null);

            if (dateRange) {
              validatedCouponQuery = validatedCouponQuery
                .gte('validated_at', dateRange.start.toISOString())
                .lte('validated_at', dateRange.end.toISOString());
            }

            const { data: validatedCoupons, error: validatedError } = await validatedCouponQuery;
            
            if (validatedError) {
              console.error(`Store ${store.name} 검증 쿠폰 조회 오류:`, validatedError);
            }

            const validatedCouponList = validatedCoupons || [];
            const validationCount = validatedCouponList.length;

            // 시간대별 검증 수 집계 (0시 ~ 23시)
            const hourlyValidation = Array.from({ length: 24 }, (_, i) => {
              const hour = i;
              const hourStart = hour;
              const hourEnd = hour === 23 ? 24 : hour + 1;

              const validation = validatedCouponList.filter((c) => {
                if (!c.validated_at) return false;
                const validatedDate = new Date(c.validated_at);
                const validatedHour = validatedDate.getHours();
                return validatedHour >= hourStart && validatedHour < hourEnd;
              }).length;

              return {
                hour: `${hour}시`,
                count: validation,
              };
            });

            return {
              id: store.id,
              name: store.name,
              slug: store.slug,
              validationCount,
              hourlyValidation,
            };
          })
        );

        // 시간대별 데이터 집계 (0시 ~ 23시, 24시간)
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          const hourStart = hour;
          const hourEnd = hour === 23 ? 24 : hour + 1;

          // 해당 시간대의 유입 수
          const inflow = visitList.filter((v) => {
            const visitDate = new Date(v.visited_at);
            const visitHour = visitDate.getHours();
            return visitHour >= hourStart && visitHour < hourEnd;
          }).length;

          // 해당 시간대의 발급 수
          const issuance = couponList.filter((c) => {
            const couponDate = new Date(c.created_at);
            const couponHour = couponDate.getHours();
            return couponHour >= hourStart && couponHour < hourEnd;
          }).length;

          // 해당 시간대의 사용 수
          const usage = couponList.filter((c) => {
            if (!c.is_used || !c.used_at) return false;
            const usedDate = new Date(c.used_at);
            const usedHour = usedDate.getHours();
            return usedHour >= hourStart && usedHour < hourEnd;
          }).length;

          return {
            hour: `${hour}시`,
            inflow,
            issuance,
            usage,
          };
        });

          return {
            id: event.id,
            name: event.name,
            domainCode: event.domain_code,
            conversionRate,
            totalInflow,
            couponIssued,
            couponUsed,
            hourlyData,
            storeStats: storeStats || [],
          };
      })
    );

    const stats = {
      totalEvents: events?.length || 0,
      events: eventsWithStats,
      bestEvent: null as {
        id: string;
        name: string;
        conversionRate: number;
        totalInflow: number;
        couponIssued: number;
        couponUsed: number;
      } | null,
      worstEvent: null as {
        id: string;
        name: string;
        conversionRate: number;
        totalInflow: number;
        couponIssued: number;
        couponUsed: number;
      } | null,
    };

    // 최고/최저 성과 이벤트 계산
    if (stats.events.length > 0) {
      // 전환율 기준으로 정렬
      const sortedByConversion = [...stats.events].sort(
        (a, b) => b.conversionRate - a.conversionRate
      );

      const bestEventData = sortedByConversion[0];
      if (bestEventData && bestEventData.conversionRate > 0) {
        stats.bestEvent = {
          id: bestEventData.id,
          name: bestEventData.name,
          conversionRate: bestEventData.conversionRate,
          totalInflow: bestEventData.totalInflow,
          couponIssued: bestEventData.couponIssued,
          couponUsed: bestEventData.couponUsed,
        };
      }

      // 발급 수가 있으면서 전환율이 낮은 이벤트 찾기
      const eventsWithIssued = sortedByConversion.filter((e) => e.couponIssued > 0);
      if (eventsWithIssued.length > 0) {
        const worstEventData = eventsWithIssued[eventsWithIssued.length - 1];
        stats.worstEvent = {
          id: worstEventData.id,
          name: worstEventData.name,
          conversionRate: worstEventData.conversionRate,
          totalInflow: worstEventData.totalInflow,
          couponIssued: worstEventData.couponIssued,
          couponUsed: worstEventData.couponUsed,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('통계 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

