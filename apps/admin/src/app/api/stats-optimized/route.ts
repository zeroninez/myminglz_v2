import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// 타입 정의
interface Location {
  id: string;
  slug: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  location_id: string;
}

interface VisitStats {
  event_id: string;
  total_visits: number;
  hourly_data: Array<{
    hour: string;
    inflow: number;
  }>;
}

interface CouponStats {
  location_id: string;
  total_issued: number;
  total_used: number;
  store_validations: Record<string, number>;
}

// 최적화된 통계 API
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

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    const period = url.searchParams.get('period') || 'all';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // 날짜 범위 설정
    let dateRange: { start: Date; end: Date } | null = null;
    if (period !== 'all') {
      const now = new Date();
      switch (period) {
        case 'today':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          };
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          dateRange = {
            start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
          };
          break;
        case 'weekly':
          dateRange = {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now
          };
          break;
        case 'monthly':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: now
          };
          break;
        case 'custom':
          if (startDate && endDate) {
            dateRange = {
              start: new Date(startDate),
              end: new Date(endDate)
            };
          }
          break;
      }
    }

    // 이벤트 조회
    let eventsQuery = supabase
      .from('events')
      .select('id, name, domain_code, start_date, end_date, user_id')
      .eq('user_id', userId);

    if (eventId && eventId !== '전체') {
      eventsQuery = eventsQuery.eq('id', eventId);
    }

    const { data: events } = await eventsQuery;
    if (!events || events.length === 0) {
      return NextResponse.json({
        success: true,
        data: { events: [] }
      });
    }

    // 배치 쿼리로 모든 데이터 한 번에 조회
    const eventIds = events.map(e => e.id);
    const domainCodes = [...new Set(events.map(e => e.domain_code).filter(Boolean))];

    // 모든 필요한 데이터를 병렬로 조회
    const [locationsResult, visitsResult, couponsResult, storesResult] = await Promise.all([
      // Locations
      supabase
        .from('locations')
        .select('id, slug')
        .in('slug', domainCodes),
      
      // 집계 쿼리 사용 (raw 데이터 대신 count와 시간대별 집계)
      supabase
        .rpc('get_visits_stats', {
          event_ids: eventIds,
          start_date: dateRange?.start?.toISOString(),
          end_date: dateRange?.end?.toISOString()
        }),
      
      // 쿠폰 데이터도 집계 쿼리로
      supabase
        .rpc('get_coupons_stats', {
          location_ids: [], // 나중에 채움
          start_date: dateRange?.start?.toISOString(),
          end_date: dateRange?.end?.toISOString()
        }),
      
      // Stores (모든 location의 stores 한 번에 조회)
      supabase
        .from('stores')
        .select('id, name, slug, location_id')
        .eq('is_active', true)
    ]);

     // 메모리 효율적인 데이터 구조 사용
     const locationMap = new Map((locationsResult.data as Location[] || []).map(loc => [loc.slug, loc.id]));
     const storesByLocation = new Map<string, Store[]>();
     (storesResult.data as Store[] || []).forEach(store => {
       if (!storesByLocation.has(store.location_id)) {
         storesByLocation.set(store.location_id, []);
       }
       storesByLocation.get(store.location_id)!.push(store);
     });

    // 결과 조합 (O(n) 복잡도)
    const eventsWithStats = events.map(event => {
      const locationId = locationMap.get(event.domain_code);
       const visitStats = (visitsResult.data as VisitStats[] || []).find(v => v.event_id === event.id) || {} as Partial<VisitStats>;
       const couponStats = (couponsResult.data as CouponStats[] || []).find(c => c.location_id === (locationId || '')) || {} as Partial<CouponStats>;
       const stores = storesByLocation.get(locationId || '') || [];

      return {
        id: event.id,
        name: event.name,
        domainCode: event.domain_code,
        startDate: event.start_date,
        endDate: event.end_date,
        storesCount: stores.length,
         totalInflow: visitStats.total_visits || 0,
         couponIssued: couponStats.total_issued || 0,
         couponUsed: couponStats.total_used || 0,
         conversionRate: (couponStats.total_issued && couponStats.total_used) 
           ? Math.round((couponStats.total_used / couponStats.total_issued) * 100 * 100) / 100 
           : 0,
        hourlyData: visitStats.hourly_data || [],
        storeStats: stores.map(store => ({
          id: store.id,
          name: store.name,
          slug: store.slug,
          validationCount: couponStats.store_validations?.[store.id] || 0
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        events: eventsWithStats,
        period,
        dateRange: dateRange ? {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        } : null
      }
    });

  } catch (error) {
    console.error('최적화된 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '통계 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}