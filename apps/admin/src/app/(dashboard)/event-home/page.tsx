'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventCard from './components/EventCard';
import UserSidebar from './components/UserSidebar';
import EventFilter from './components/EventFilter';
import { useEvents } from '@/contexts/EventsContext';

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

  // 통계 데이터 조회 (이벤트 목록이 있을 때만)
  useEffect(() => {
    if (events.length === 0) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        
        // 각 이벤트의 통계 조회
        const statsPromises = events.map(async (event: Event) => {
          try {
            const statsResponse = await fetch(`/api/stats?eventId=${event.id}&period=all`);
            const statsResult = await statsResponse.json();
            
            if (statsResult.success && statsResult.data?.events) {
              const eventStat = statsResult.data.events.find((e: any) => e.id === event.id);
              if (eventStat) {
                // 어제 통계도 조회
                const yesterdayResponse = await fetch(`/api/stats?eventId=${event.id}&period=yesterday`);
                const yesterdayResult = await yesterdayResponse.json();
                const yesterdayStat = yesterdayResult.success && yesterdayResult.data?.events
                  ? yesterdayResult.data.events.find((e: any) => e.id === event.id)
                  : null;

                return {
                  id: event.id,
                  stats: {
                    id: event.id,
                    totalInflow: eventStat.totalInflow || 0,
                    couponIssued: eventStat.couponIssued || 0,
                    couponUsed: eventStat.couponUsed || 0,
                    couponIssuedYesterday: yesterdayStat?.couponIssued || 0,
                    couponUsedYesterday: yesterdayStat?.couponUsed || 0,
                  },
                };
              }
            }
            return { id: event.id, stats: null };
          } catch (err) {
            console.error(`이벤트 ${event.id} 통계 조회 오류:`, err);
            return { id: event.id, stats: null };
          }
        });

        const statsResults = await Promise.all(statsPromises);
        const statsMap: Record<string, EventStats> = {};
        statsResults.forEach(({ id, stats }) => {
          if (stats) {
            statsMap[id] = stats;
          }
        });
        setEventStats(statsMap);

      } catch (err: any) {
        console.error('통계 데이터 로드 오류:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [events]);

  const getEventStatus = (event: Event): 'ongoing' | 'ended' | 'saved' => {
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
  };

  const filteredEvents = selectedFilter === '전체' 
    ? events.filter(e => getEventStatus(e) === 'ongoing')
    : events.filter(e => e.name === selectedFilter && getEventStatus(e) === 'ongoing');

  const eventNames = Array.from(new Set(events.filter(e => getEventStatus(e) === 'ongoing').map(e => e.name)));
  const totalEvents = events.length;
  const ongoingEvents = events.filter(e => getEventStatus(e) === 'ongoing').length;
  const savedEvents = events.filter(e => getEventStatus(e) === 'saved').length;
  const endedEvents = events.filter(e => getEventStatus(e) === 'ended').length;

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://myminglz-v2-web.vercel.app';
  const displayName = userInfo?.name || userInfo?.email?.split('@')[0] || '사용자';
  const loading = eventsLoading || statsLoading;
  const error = eventsError;

  if (eventsLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
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
