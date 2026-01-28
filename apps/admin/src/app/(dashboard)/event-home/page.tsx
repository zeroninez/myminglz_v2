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
            {/* 캘린더 아이콘 (임시 박스) */}
            <div className="w-24 h-24 bg-blue-200 rounded-lg mb-8 flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-300 rounded"></div>
            </div>
            
            {/* 텍스트 */}
            <p className="text-lg font-medium text-gray-900 mb-2">아직 만들어진 이벤트가 없어요</p>
            <p className="text-sm text-gray-600 mb-8">지금 첫 이벤트를 생성해보세요!</p>
            
            {/* 이벤트 생성하기 버튼 */}
            <Link
              href="/create"
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#4D82F3] rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <span>이벤트 생성하기</span>
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
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
