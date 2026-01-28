'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { apiGet } from '@/utils/apiClient';
import StatsFilter from './components/StatsFilter';
import EventInfoTable from './components/EventInfoTable';
import StatsCards from './components/StatsCards';
import HourlyChart from './components/HourlyChart';
import StoreStats from './components/StoreStats';
import StatsTooltip from './components/StatsTooltip';

type TimePeriod = 'all' | 'yesterday' | 'today' | 'thisWeek' | 'thisMonth';
type ChartType = 'all' | 'inflow' | 'issuance' | 'usage';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface StoreStat {
  id: string;
  name: string;
  slug: string;
  validationCount: number;
  hourlyValidation: Array<{
    hour: string;
    count: number;
  }>;
}

interface EventStats {
  id: string;
  name: string;
  domainCode: string;
  startDate?: string | null;
  endDate?: string | null;
  storesCount?: number;
  conversionRate: number;
  totalInflow: number;
  couponIssued: number;
  couponUsed: number;
  hourlyData: Array<{
    hour: string;
    inflow: number;
    issuance: number;
    usage: number;
  }>;
  storeStats?: StoreStat[];
}

interface StatsData {
  totalEvents: number;
  events: EventStats[];
  bestEvent: {
    id: string;
    name: string;
    conversionRate: number;
    totalInflow: number;
    couponIssued: number;
    couponUsed: number;
  } | null;
  worstEvent: {
    id: string;
    name: string;
    conversionRate: number;
    totalInflow: number;
    couponIssued: number;
    couponUsed: number;
  } | null;
}

export default function StatsPage() {
  const { events: cachedEvents, loading: eventsLoading } = useEvents();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('전체');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [chartType, setChartType] = useState<ChartType>('all');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedEventStats, setSelectedEventStats] = useState<EventStats | null>(null);
  const [previousStats, setPreviousStats] = useState<StatsData | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set()); // 'all'은 빈 Set으로 표시
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  // 툴팁 상태
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: {
      hour: string;
      inflow: number;
      issuance: number;
      usage: number;
    } | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    data: null
  });

  // Context에서 이벤트 데이터 가져오기
  useEffect(() => {
    if (cachedEvents.length > 0) {
      setEvents(cachedEvents as Event[]);
    }
  }, [cachedEvents]);




  // 통계 데이터 가져오기 (재시도 로직 포함)
  const fetchStats = useCallback(async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      setStatsLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedEvent !== '전체' && { eventId: selectedEvent }),
        ...(customStartDate && { startDate: customStartDate }),
        ...(customEndDate && { endDate: customEndDate }),
      });

      const response = await apiGet(`/api/stats?${params.toString()}`);
      
      if (!response.ok) {
        console.error('API 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        // 401 인증 오류인 경우 로그인 페이지로 리다이렉트
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        // 다른 HTTP 오류의 경우 빈 데이터로 설정
        setStats(null);
        setSelectedEventStats(null);
        return;
      }
      
      const result = await response.json();

      if (!result.success) {
        // 인증 오류이고 재시도 가능한 경우 조용히 재시도
        if (result.error?.includes('인증') && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 대기
          return fetchStats(retryCount + 1);
        }
        
        // 권한 오류의 경우 조용히 처리 (에러 로그 없이)
        if (result.error?.includes('권한')) {
          setStats(null);
          setSelectedEventStats(null);
          return;
        }
        
        // 기타 오류만 로그에 기록
        console.error('통계 데이터 로드 오류:', {
          error: result.error,
          params: params.toString(),
          selectedEvent,
          selectedPeriod,
          retryCount
        });
        
        // API 응답은 성공했지만 데이터 로드 실패 시 빈 데이터로 설정
        setStats(null);
        setSelectedEventStats(null);
        return;
      }

      // 이전 데이터 백업 (로딩 중에도 표시하기 위해)
      if (result.data) {
        setPreviousStats(stats);
        setStats(result.data);
        setIsInitialLoad(false);
      }
      
      // 선택된 이벤트의 통계 찾기
      if (selectedEvent !== '전체' && result.data?.events) {
        const eventStat = result.data.events.find((e: EventStats) => e.id === selectedEvent);
        setSelectedEventStats(eventStat || null);
      } else {
        setSelectedEventStats(null);
      }
    } catch (err: any) {
      // 초기 로딩 시 인증 관련 오류는 조용히 처리
      if (retryCount === 0 && (err.message?.includes('인증') || err.message?.includes('권한'))) {
        // 조용히 처리
      } else {
      console.error('통계 데이터 로드 오류:', err);
      }
      
      // 네트워크 오류 등 예외 발생 시 빈 데이터로 설정
      setStats(null);
      setSelectedEventStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedEvent, selectedPeriod, customStartDate, customEndDate]);

  // 이벤트 로드 완료 시 및 필터 변경 시 통계 데이터 자동 조회
  useEffect(() => {
    // 이벤트가 로드되고 로딩 상태가 아닐 때만 통계 데이터 조회
    if (events.length > 0 && !eventsLoading) {
      // 약간의 지연을 두어 인증 상태가 안정화되도록 함
      const timer = setTimeout(() => {
      fetchStats();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [events.length, eventsLoading, selectedEvent, selectedPeriod, customStartDate, customEndDate, fetchStats]);


  // 선택된 이벤트가 변경되면 store 필터 초기화
  useEffect(() => {
    setSelectedStoreIds(new Set());
  }, [selectedEvent]);

  // 이벤트가 변경될 때 커스텀 날짜 초기화 및 종료된 이벤트 처리
  useEffect(() => {
    setCustomStartDate('');
    setCustomEndDate('');
    setShowDatePicker(false);
    
    // 종료된 이벤트의 경우 기본 기간을 이벤트 전체 기간으로 설정
    if (selectedEvent !== '전체') {
      const event = events.find(e => e.id === selectedEvent);
      if (event?.end_date) {
        const today = new Date();
        const endDate = new Date(event.end_date);
        const isEnded = endDate < today;
        
        if (isEnded && event.start_date) {
          setCustomStartDate(event.start_date);
          setCustomEndDate(event.end_date);
        }
        setSelectedPeriod('all'); // 기간 버튼을 비활성화하기 위해
      }
    }
  }, [selectedEvent, events]);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleReset = () => {
    setSelectedEvent('전체');
    setSelectedPeriod('all');
    setChartType('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowDatePicker(false);
  };

  // 툴팁 핸들러
  const handleMouseEnter = (event: React.MouseEvent, data: any) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      data: data
    });
  };

  const handleMouseLeave = () => {
    setTooltip({
      show: false,
      x: 0,
      y: 0,
      data: null
    });
  };


  // 차트 데이터 (선택된 이벤트 또는 전체)
  const chartData = useMemo(() => {
    if (selectedEventStats) {
      // 개별 이벤트 선택 시
      return selectedEventStats.hourlyData || [];
    } else if (stats?.events && stats.events.length > 0) {
      // 전체 이벤트 선택 시 - 모든 이벤트의 시간대별 데이터를 합산
      const hourlyMap: { [hour: string]: { inflow: number; issuance: number; usage: number } } = {};
      
      stats.events.forEach(event => {
        if (event.hourlyData) {
          event.hourlyData.forEach(hourData => {
            if (!hourlyMap[hourData.hour]) {
              hourlyMap[hourData.hour] = { inflow: 0, issuance: 0, usage: 0 };
            }
            hourlyMap[hourData.hour].inflow += hourData.inflow || 0;
            hourlyMap[hourData.hour].issuance += hourData.issuance || 0;
            hourlyMap[hourData.hour].usage += hourData.usage || 0;
          });
        }
      });
      
      // 시간순으로 정렬하여 반환
      return Object.entries(hourlyMap)
        .map(([hour, data]) => ({ hour, ...data }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }
    return [];
  }, [selectedEventStats, stats]);
  const maxValue = Math.max(
    ...chartData.map((d) => {
      if (chartType === 'all') {
        return Math.max(d.inflow, d.issuance, d.usage);
      }
      if (chartType === 'inflow') return d.inflow;
      if (chartType === 'issuance') return d.issuance;
      return d.usage;
    }),
    1
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6">
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-5">이벤트 통계</h2>
          </div>

      <StatsFilter
        events={events}
        eventsLoading={eventsLoading}
        selectedEvent={selectedEvent}
        selectedPeriod={selectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        showDatePicker={showDatePicker}
        onEventChange={setSelectedEvent}
        onPeriodChange={setSelectedPeriod}
        onCustomDateChange={(startDate, endDate) => {
          setCustomStartDate(startDate);
          setCustomEndDate(endDate);
        }}
        onShowDatePickerChange={setShowDatePicker}
        onRefresh={() => {
          setSelectedPeriod('all');
          setCustomStartDate('');
          setCustomEndDate('');
          setShowDatePicker(false);
        }}
      />

      <EventInfoTable selectedEvent={selectedEvent} events={events} />

      <div className="space-y-6">
        <StatsCards
          stats={stats}
          previousStats={previousStats}
          selectedEvent={selectedEvent}
          selectedEventStats={selectedEventStats}
          selectedPeriod={selectedPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          statsLoading={statsLoading}
          isInitialLoad={isInitialLoad}
        />
      


        <HourlyChart
          chartData={chartData}
          chartType={chartType}
          selectedPeriod={selectedPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          statsLoading={statsLoading}
          isInitialLoad={isInitialLoad}
          onChartTypeChange={setChartType}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        <StoreStats
          selectedEvent={selectedEvent}
          selectedEventStats={selectedEventStats}
          selectedStoreIds={selectedStoreIds}
          selectedPeriod={selectedPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onStoreSelectionChange={setSelectedStoreIds}
        />

        <StatsTooltip
          show={tooltip.show}
          x={tooltip.x}
          y={tooltip.y}
          data={tooltip.data}
          chartType={chartType}
                              />
                            </div>
    </div>
  );
}
