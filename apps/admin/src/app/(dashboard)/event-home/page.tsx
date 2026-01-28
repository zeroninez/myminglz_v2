'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import EventCard from './components/EventCard';
import UserSidebar from './components/UserSidebar';
import EventFilter from './components/EventFilter';
import { useEvents } from '@/contexts/EventsContext';
import { apiGet } from '@/utils/apiClient';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  background_color: string;
  created_at: string;
  updated_at: string;
  event_info_config?: {
    stores?: Array<{ id?: string; name: string }>;
  } | null;
}

interface EventStats {
  id: string;
  totalInflow: number;
  couponIssued: number;
  couponUsed: number;
  totalInflowToday?: number;
  totalInflowYesterday?: number;
  couponIssuedToday?: number;
  couponUsedToday?: number;
  couponIssuedYesterday?: number;
  couponUsedYesterday?: number;
}

interface UserInfo {
  email: string;
  name?: string;
}



export default function EventHomePage() {
  const { events: cachedEvents, loading: eventsLoading, error: eventsError } = useEvents();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('전체');
  const [currentDate] = useState(new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, ''));
  const [lastStatsUpdate, setLastStatsUpdate] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const result = await response.json();
        if (result.success) {
          setUserInfo({
            email: result.user.email,
            name: result.user.name,
          });
        }
      } catch (err) {
        console.error('사용자 정보 로드 오류:', err);
      }
    };

    fetchUserInfo();
  }, []);

  // Context에서 이벤트 데이터 가져오기
  useEffect(() => {
    if (cachedEvents.length > 0) {
      setEvents(cachedEvents as Event[]);
    }
  }, [cachedEvents]);

  // 통계 데이터 조회 (새로운 최적화된 API 사용)
  const fetchStats = useCallback(async (eventIds: string[], forceRefresh = false) => {
    if (eventIds.length === 0) return;

    // 2분 이내에 가져온 통계 데이터가 있고 강제 새로고침이 아닌 경우 스킵
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    if (!forceRefresh && lastStatsUpdate && lastStatsUpdate > twoMinutesAgo && Object.keys(eventStats).length > 0) {
      return;
    }

    try {
      setStatsLoading(true);
      
      console.log('통계 데이터 조회 시작:', eventIds);
      
      // 새로운 최적화된 API 사용
      const response = await apiGet(`/api/event-home-stats?eventIds=${eventIds.join(',')}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('API 응답:', result);
        
        if (result.success && result.data) {
          const statsMap: Record<string, EventStats> = {};
          result.data.forEach((stat: any) => {
            statsMap[stat.id] = {
              id: stat.id,
              totalInflow: stat.totalInflow || 0,
              couponIssued: stat.couponIssued || 0,
              couponUsed: stat.couponUsed || 0,
              totalInflowToday: stat.totalInflowToday || 0,
              totalInflowYesterday: stat.totalInflowYesterday || 0,
              couponIssuedToday: stat.couponIssuedToday || 0,
              couponUsedToday: stat.couponUsedToday || 0,
              couponIssuedYesterday: stat.couponIssuedYesterday || 0,
              couponUsedYesterday: stat.couponUsedYesterday || 0,
            };
          });
          console.log('처리된 통계 데이터:', statsMap);
          setEventStats(statsMap);
          setLastStatsUpdate(Date.now());
        } else {
          console.error('API 응답 오류:', result);
        }
      } else {
        console.error('통계 데이터 조회 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('오류 내용:', errorText);
      }
    } catch (err: any) {
      console.error('통계 데이터 로드 오류:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [lastStatsUpdate, eventStats]);

  // 이벤트 목록이 변경될 때만 통계 데이터 조회
  useEffect(() => {
    if (events.length > 0) {
      const eventIds = events.map(event => event.id);
      fetchStats(eventIds);
    }
  }, [events, fetchStats]);

  // 이벤트 상태 계산을 메모이제이션
  const getEventStatus = useCallback((event: Event): 'ongoing' | 'ended' | 'saved' => {
    if (!event.start_date && !event.end_date) return 'saved';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (event.end_date) {
      const endDate = new Date(event.end_date);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < today) return 'ended';
    }
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (startDate <= today) return 'ongoing';
    }
    return 'saved';
  }, []);

  // 이벤트 상태별 분류를 메모이제이션
  const eventsByStatus = useMemo(() => {
    const ongoing: Event[] = [];
    const ended: Event[] = [];
    const saved: Event[] = [];

    events.forEach(event => {
      const status = getEventStatus(event);
      switch (status) {
        case 'ongoing':
          ongoing.push(event);
          break;
        case 'ended':
          ended.push(event);
          break;
        case 'saved':
          saved.push(event);
          break;
      }
    });

    return { ongoing, ended, saved };
  }, [events, getEventStatus]);

  // 필터링된 이벤트 목록
  const filteredEvents = useMemo(() => {
    return selectedFilter === '전체' 
      ? eventsByStatus.ongoing
      : eventsByStatus.ongoing.filter(e => e.name === selectedFilter);
  }, [selectedFilter, eventsByStatus.ongoing]);

  // 이벤트 이름 목록
  const eventNames = useMemo(() => {
    return Array.from(new Set(eventsByStatus.ongoing.map(e => e.name)));
  }, [eventsByStatus.ongoing]);

  // 통계 수치들
  const totalEvents = events.length;
  const ongoingEvents = eventsByStatus.ongoing.length;
  const savedEvents = eventsByStatus.saved.length;
  const endedEvents = eventsByStatus.ended.length;

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://myminglz-v2-web.vercel.app';
  const displayName = userInfo?.name || userInfo?.email?.split('@')[0] || '사용자';
  const error = eventsError;

  // 초기 로딩 상태 (이벤트 데이터가 없을 때만)
  if (eventsLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <div className="text-gray-500">이벤트 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (eventsError && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{eventsError}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      {/* 상단: 이벤트 홈 제목 */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">이벤트 홈</h2>
      </div>

      {/* 하단: 좌우 분할 레이아웃 */}
      <div className="flex flex-1 overflow-hidden">
        <UserSidebar
          displayName={displayName}
          totalEvents={totalEvents}
          ongoingEvents={ongoingEvents}
          savedEvents={savedEvents}
          endedEvents={endedEvents}
        />

        {/* 우측: 현재 진행중인 이벤트 */}
        <div className={`flex-1 overflow-y-auto ${filteredEvents.length === 0 ? 'bg-[#F3F7FF]' : 'bg-white'}`}>
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-6">
              현재 진행중인 이벤트 ({currentDate} 기준)
            </h3>

            <EventFilter
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              eventNames={eventNames}
              ongoingEvents={ongoingEvents}
            />

        {/* 이벤트 카드 목록 */}
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            {/* 이벤트 없음 일러스트 */}
            <div className="mb-8">
              <img 
                src="/images/eventhome/Group 2147237245.png" 
                alt="이벤트가 없습니다"
                className="w-auto h-auto max-w-40"
              />
            </div>
            
            {/* 텍스트 */}
            <p className="text-sm font-medium mb-2" style={{ color: '#888888' }}>아직 만들어진 이벤트가 없어요</p>
            <p className="text-lg font-bold mb-8" style={{ color: '#32373D' }}>지금 첫 이벤트를 생성해보세요!</p>
            
            {/* 이벤트 생성하기 버튼 */}
            <Link
              href="/create"
              className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-blue-50 transition-colors font-bold"
              style={{ color: '#4D82F3' }}
            >
              <span>이벤트 생성하기</span>
              <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24.0243 14.7833C24.0243 14.5383 24.1216 14.3032 24.2949 14.1299C24.4682 13.9567 24.7032 13.8593 24.9483 13.8593C25.1934 13.8593 25.4284 13.9567 25.6017 14.1299C25.7749 14.3032 25.8723 14.5383 25.8723 14.7833V24.9473C25.8723 25.1924 25.7749 25.4274 25.6017 25.6007C25.4284 25.774 25.1934 25.8713 24.9483 25.8713H4.62029C4.37523 25.8713 4.14021 25.774 3.96692 25.6007C3.79364 25.4274 3.69629 25.1924 3.69629 24.9473V4.61931C3.69629 4.37425 3.79364 4.13923 3.96692 3.96595C4.14021 3.79266 4.37523 3.69531 4.62029 3.69531H14.7843C15.0294 3.69531 15.2644 3.79266 15.4377 3.96595C15.6109 4.13923 15.7083 4.37425 15.7083 4.61931C15.7083 4.86437 15.6109 5.0994 15.4377 5.27268C15.2644 5.44596 15.0294 5.54331 14.7843 5.54331H5.54429V24.0233H24.0243V14.7833Z" fill="#4D82F3"/>
                <path d="M13.5702 16.0027L15.0948 15.7846L24.4605 6.42077C24.5487 6.33553 24.6191 6.23358 24.6676 6.12084C24.716 6.00811 24.7415 5.88686 24.7425 5.76418C24.7436 5.64149 24.7202 5.51982 24.6738 5.40626C24.6273 5.2927 24.5587 5.18954 24.472 5.10278C24.3852 5.01602 24.282 4.94741 24.1685 4.90095C24.0549 4.8545 23.9332 4.83112 23.8106 4.83218C23.6879 4.83325 23.5666 4.85874 23.4539 4.90716C23.3412 4.95559 23.2392 5.02598 23.154 5.11423L13.7864 14.4781L13.5684 16.0027H13.5702ZM25.767 3.80585C26.0246 4.06328 26.229 4.36894 26.3684 4.70537C26.5078 5.0418 26.5796 5.4024 26.5796 5.76658C26.5796 6.13075 26.5078 6.49136 26.3684 6.82779C26.229 7.16422 26.0246 7.46988 25.767 7.72731L16.1852 17.3092C16.0439 17.451 15.8603 17.5431 15.6622 17.5716L12.613 18.0077C12.4709 18.0281 12.326 18.0152 12.1897 17.9698C12.0535 17.9245 11.9298 17.848 11.8283 17.7465C11.7267 17.645 11.6503 17.5212 11.6049 17.385C11.5596 17.2488 11.5466 17.1039 11.567 16.9618L12.0031 13.9126C12.0311 13.7146 12.1226 13.5311 12.2637 13.3896L21.8474 3.8077C22.3673 3.28803 23.0722 2.99609 23.8072 2.99609C24.5423 2.99609 25.2472 3.28803 25.767 3.8077V3.80585Z" fill="#4D82F3"/>
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      stats={eventStats[event.id]}
                      baseUrl={baseUrl}
                      isStatsLoading={statsLoading}
                    />
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
