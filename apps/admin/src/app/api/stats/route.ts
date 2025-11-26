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

    // TODO: 실제 통계 데이터는 추적 테이블이 추가되면 구현
    // 현재는 이벤트 정보만 반환하고, 통계는 0으로 초기화
    const stats = {
      totalEvents: events?.length || 0,
      events: (events || []).map((event) => ({
        id: event.id,
        name: event.name,
        domainCode: event.domain_code,
        // 실제 통계 데이터는 추적 테이블이 추가되면 계산
        conversionRate: 0, // 전환율 (%)
        totalInflow: 0, // 총 유입 수
        couponIssued: 0, // 쿠폰 발급 수
        couponUsed: 0, // 쿠폰 사용 수
        hourlyData: Array.from({ length: 12 }, (_, i) => {
          const hour = 10 + i; // 10am ~ 9pm
          return {
            hour: hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
            inflow: 0,
            issuance: 0,
            usage: 0,
          };
        }),
      })),
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

    // 최고/최저 성과 이벤트 계산 (실제 데이터가 있으면)
    if (stats.events.length > 0) {
      // 임시로 첫 번째 이벤트를 최고/최저로 설정 (실제 데이터 연동 시 수정)
      const firstEvent = stats.events[0];
      stats.bestEvent = {
        id: firstEvent.id,
        name: firstEvent.name,
        conversionRate: firstEvent.conversionRate,
        totalInflow: firstEvent.totalInflow,
        couponIssued: firstEvent.couponIssued,
        couponUsed: firstEvent.couponUsed,
      };
      stats.worstEvent = {
        id: firstEvent.id,
        name: firstEvent.name,
        conversionRate: firstEvent.conversionRate,
        totalInflow: firstEvent.totalInflow,
        couponIssued: firstEvent.couponIssued,
        couponUsed: firstEvent.couponUsed,
      };
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

