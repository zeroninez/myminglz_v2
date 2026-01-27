'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { format } from 'date-fns';
import DateRangePicker from '../create/components/DateRangePicker';

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
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set()); // 'all'은 빈 Set으로 표시
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const datePickerRef = useRef<HTMLDivElement>(null);
  
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

  // DatePicker 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // 선택된 이벤트의 날짜 범위 가져오기
  const getSelectedEventDateRange = () => {
    if (selectedEvent === '전체') {
      return { minDate: undefined, maxDate: undefined };
    }
    
    const event = events.find(e => e.id === selectedEvent);
    if (!event) {
      return { minDate: undefined, maxDate: undefined };
    }
    
    return {
      minDate: event.start_date || undefined,
      maxDate: event.end_date || undefined
    };
  };

  // 선택된 이벤트가 종료되었는지 확인
  const isSelectedEventEnded = () => {
    if (selectedEvent === '전체') return false;
    
    const event = events.find(e => e.id === selectedEvent);
    if (!event?.end_date) return false;
    
    const today = new Date();
    const endDate = new Date(event.end_date);
    return endDate < today;
  };

  // 이벤트가 시작되었는지 확인 (시작되지 않은 이벤트 필터링용)
  const isEventStarted = (event: Event) => {
    if (!event.start_date) return false;
    
    const today = new Date();
    const startDate = new Date(event.start_date);
    return startDate <= today;
  };

  // 통계에 표시할 이벤트 목록 (시작된 이벤트만)
  const availableEvents = events.filter(isEventStarted);

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

      const response = await fetch(`/api/stats?${params.toString()}`, {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
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
        console.error('통계 데이터 로드 오류:', {
          error: result.error,
          params: params.toString(),
          selectedEvent,
          selectedPeriod,
          customStartDate,
          customEndDate,
          retryCount
        });
        
        // 인증 오류이고 재시도 가능한 경우 재시도
        if (result.error?.includes('인증') && retryCount < maxRetries) {
          console.log(`인증 오류로 인한 재시도 (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          return fetchStats(retryCount + 1);
        }
        
        // API 응답은 성공했지만 데이터 로드 실패 시 빈 데이터로 설정
        setStats(null);
        setSelectedEventStats(null);
        return;
      }

      setStats(result.data || null);
      
      // 선택된 이벤트의 통계 찾기
      if (selectedEvent !== '전체' && result.data?.events) {
        const eventStat = result.data.events.find((e: EventStats) => e.id === selectedEvent);
        setSelectedEventStats(eventStat || null);
      } else {
        setSelectedEventStats(null);
      }
    } catch (err: any) {
      console.error('통계 데이터 로드 오류:', err);
      // 네트워크 오류 등 예외 발생 시 빈 데이터로 설정
      setStats(null);
      setSelectedEventStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedEvent, selectedPeriod, customStartDate, customEndDate]);

  // 이벤트 로드 완료 시 및 필터 변경 시 통계 데이터 자동 조회
  useEffect(() => {
    if (events.length > 0) {
      fetchStats();
    }
  }, [events.length, selectedEvent, selectedPeriod, customStartDate, customEndDate, fetchStats]);

  // 이벤트가 변경될 때 커스텀 날짜 초기화 및 종료된 이벤트 처리
  useEffect(() => {
    setCustomStartDate('');
    setCustomEndDate('');
    setShowDatePicker(false);
    
    // 종료된 이벤트의 경우 기본 기간을 이벤트 전체 기간으로 설정
    if (isSelectedEventEnded()) {
      const event = events.find(e => e.id === selectedEvent);
      if (event?.start_date && event?.end_date) {
        setCustomStartDate(event.start_date);
        setCustomEndDate(event.end_date);
      }
      setSelectedPeriod('all'); // 기간 버튼을 비활성화하기 위해
    }
  }, [selectedEvent, events]);

  // 선택된 이벤트가 변경되면 store 필터 초기화
  useEffect(() => {
    setSelectedStoreIds(new Set());
  }, [selectedEvent]);

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

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '미설정';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '미설정';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '미설정';
    }
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
      <section className="bg-white px-0 pt-0 pb-0">
          <div>
        
        {/* 검색 필터 */}
        <div className="p-4" style={{ backgroundColor: '#F3F7FF' }}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold whitespace-nowrap" style={{ color: '#32373D' }}>
                이벤트
              </label>
            <div className="relative">
              <select
                value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    // 전체 이벤트 선택 시 기간을 전체로 초기화
                    if (e.target.value === '전체') {
                      setSelectedPeriod('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setShowDatePicker(false);
                    }
                  }}
                disabled={eventsLoading}
                  className="w-64 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm placeholder:text-sm appearance-none pr-10"
                  style={{ color: '#8E8E8E' }}
              >
                  <option value="전체" style={{ color: '#8E8E8E' }}>전체 이벤트 (통합)</option>
                {eventsLoading ? (
                    <option value="" disabled style={{ color: '#8E8E8E' }}>로딩 중...</option>
                  ) : availableEvents.length === 0 ? (
                    <option value="" disabled style={{ color: '#8E8E8E' }}>시작된 이벤트가 없습니다</option>
                  ) : (
                    availableEvents.map((event) => (
                      <option key={event.id} value={event.id} style={{ color: '#8E8E8E' }}>
                      {event.name}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-bold" style={{ color: '#32373D' }}>범위</span>
              <button
                onClick={() => {
                  setSelectedPeriod('today');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setShowDatePicker(false);
                }}
                disabled={isSelectedEventEnded()}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'today'
                    ? 'text-white'
                    : 'bg-white hover:bg-gray-50 border border-gray-300'
                } ${isSelectedEventEnded() ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={selectedPeriod === 'today' ? { backgroundColor: '#414B55' } : { color: '#8E8E8E' }}
              >
                일간
              </button>
              <button
                onClick={() => {
                  setSelectedPeriod('thisWeek');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setShowDatePicker(false);
                }}
                disabled={isSelectedEventEnded()}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'thisWeek'
                    ? 'text-white'
                    : 'bg-white hover:bg-gray-50 border border-gray-300'
                } ${isSelectedEventEnded() ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={selectedPeriod === 'thisWeek' ? { backgroundColor: '#414B55' } : { color: '#8E8E8E' }}
              >
                주간
              </button>
              <button
                onClick={() => {
                  setSelectedPeriod('thisMonth');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setShowDatePicker(false);
                }}
                disabled={isSelectedEventEnded()}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'thisMonth'
                    ? 'text-white'
                    : 'bg-white hover:bg-gray-50 border border-gray-300'
                } ${isSelectedEventEnded() ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={selectedPeriod === 'thisMonth' ? { backgroundColor: '#414B55' } : { color: '#8E8E8E' }}
              >
                월간
              </button>
              <div className="flex items-center gap-2">
                <div className="relative" ref={datePickerRef}>
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                      showDatePicker || (customStartDate && customEndDate)
                        ? 'text-white'
                        : 'bg-white hover:bg-gray-50 border border-gray-300'
                    }`}
                    style={
                      showDatePicker || (customStartDate && customEndDate)
                        ? { backgroundColor: '#414B55' }
                        : { color: '#8E8E8E' }
                    }
                  >
                    기간설정
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.5 3H16.5V1.5H15V3H9V1.5H7.5V3H4.5C3.675 3 3 3.675 3 4.5V19.5C3 20.325 3.675 21 4.5 21H19.5C20.325 21 21 20.325 21 19.5V4.5C21 3.675 20.325 3 19.5 3ZM19.5 19.5H4.5V9H19.5V19.5ZM19.5 7.5H4.5V4.5H7.5V6H9V4.5H15V6H16.5V4.5H19.5V7.5Z" fill={
                        showDatePicker || (customStartDate && customEndDate) ? "#FFFFFF" : "#8E8E8E"
                      }/>
                    </svg>
                  </button>
                  
                  {showDatePicker && (
                    <div className="absolute top-full left-0 mt-2 z-50">
                      <DateRangePicker
                        startDate={customStartDate}
                        endDate={customEndDate}
                        onDateChange={(startDate, endDate) => {
                          setCustomStartDate(startDate);
                          setCustomEndDate(endDate);
                          setSelectedPeriod('all'); // 커스텀 기간으로 설정
                          setShowDatePicker(false);
                        }}
                        placeholder="기간을 선택해주세요"
                        allowPastDates={true}
                        autoOpen={true}
                        hideInput={true}
                        minDate={getSelectedEventDateRange().minDate}
                        maxDate={getSelectedEventDateRange().maxDate}
                        defaultMonth={(() => {
                          // 종료된 이벤트의 경우 이벤트 시작 날짜 월로 설정
                          const minDate = getSelectedEventDateRange().minDate;
                          if (isSelectedEventEnded() && minDate) {
                            return new Date(minDate);
                          }
                          // 진행중/대기 이벤트는 현재 날짜 월로 설정
                          return new Date();
                        })()}
                      />
                    </div>
                  )}
          </div>

                {/* 새로고침 버튼 */}
                <button
                  onClick={() => {
                    // 범위를 디폴트(전체)로 초기화
                    setSelectedPeriod('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setShowDatePicker(false);
                  }}
                  className="px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300"
                  style={{ color: '#8E8E8E' }}
                  title="새로고침"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 선택된 이벤트 및 기간 정보 - 전체 이벤트가 아닐 때만 표시 */}
      {selectedEvent !== '전체' && (
        <div className="bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: '#F3F4F6' }}>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap" style={{ color: '#8F8F8F', width: '40%' }}>
                    이벤트 명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap" style={{ color: '#8F8F8F', width: '25%' }}>
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap" style={{ color: '#8F8F8F', width: '35%' }}>
                    이벤트 기간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      {availableEvents.find(e => e.id === selectedEvent)?.name || '선택된 이벤트'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="text-sm text-gray-500">
                      {formatDate(availableEvents.find(e => e.id === selectedEvent)?.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const event = events.find(e => e.id === selectedEvent);
                        if (!event?.start_date || !event?.end_date) return '기간 미설정';
                        return `${new Date(event.start_date).toLocaleDateString('ko-KR')} ~ ${new Date(event.end_date).toLocaleDateString('ko-KR')}`;
                      })()}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-6">
      {/* 평균 이벤트 현황 */}
      <section className="bg-white p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            평균 이벤트 현황 ({(() => {
              // 커스텀 날짜가 설정된 경우
              if (customStartDate && customEndDate) {
                if (customStartDate === customEndDate) {
                  return format(new Date(customStartDate), 'yyyy.MM.dd');
                } else {
                  return `${format(new Date(customStartDate), 'yyyy.MM.dd')} ~ ${format(new Date(customEndDate), 'yyyy.MM.dd')}`;
                }
              }
              
              // 기본 기간별 표시
              const today = new Date();
              switch (selectedPeriod) {
                case 'today':
                  return format(today, 'yyyy.MM.dd');
                case 'thisWeek':
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - 6);
                  return `${format(weekStart, 'yyyy.MM.dd')} ~ ${format(today, 'yyyy.MM.dd')}`;
                case 'thisMonth':
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  return `${format(monthStart, 'yyyy.MM.dd')} ~ ${format(monthEnd, 'yyyy.MM.dd')}`;
                default:
                  return '전체 기간';
              }
            })()} 기준)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 전환율 */}
          <div className="bg-gray-50 rounded border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded flex items-center justify-center mr-3" style={{ backgroundColor: '#E7EAF1' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.1 21.044C16.2333 21.0493 15.3858 20.9564 14.5573 20.7653C13.7289 20.5742 13.016 20.1796 12.4187 19.5813C11.9396 19.1031 11.5707 18.5564 11.312 17.9413C11.0524 17.3262 10.9227 16.6818 10.9227 16.008C10.9227 15.7173 10.9427 15.4409 10.9827 15.1787C11.0218 14.9156 11.0916 14.6498 11.192 14.3813C11.2471 14.2178 11.2418 14.0582 11.176 13.9027C11.1102 13.7471 11.0062 13.6391 10.864 13.5787C10.7173 13.5191 10.5676 13.5236 10.4147 13.592C10.2618 13.6604 10.1578 13.7769 10.1027 13.9413C9.99156 14.2747 9.904 14.6124 9.84 14.9547C9.776 15.296 9.744 15.6444 9.744 16C9.744 16.8373 9.90311 17.636 10.2213 18.396C10.5404 19.156 10.9938 19.8298 11.5813 20.4173C12.2676 21.1249 13.0889 21.6027 14.0453 21.8507C15.0018 22.0996 15.9729 22.2262 16.9587 22.2307L15.6747 23.516C15.56 23.6307 15.4982 23.7658 15.4893 23.9213C15.4804 24.0769 15.5422 24.2204 15.6747 24.352C15.8071 24.4836 15.9462 24.5493 16.092 24.5493C16.2378 24.5493 16.3773 24.4836 16.5107 24.352L18.5413 22.3213C18.7564 22.1053 18.864 21.8538 18.864 21.5667C18.864 21.2796 18.7564 21.0284 18.5413 20.8133L16.5107 18.7827C16.3951 18.6671 16.26 18.6053 16.1053 18.5973C15.9498 18.5884 15.8062 18.6502 15.6747 18.7827C15.5431 18.9151 15.4773 19.0542 15.4773 19.2C15.4773 19.3458 15.5431 19.4853 15.6747 19.6187L17.1 21.044ZM14.9187 10.9493C15.7853 10.9493 16.6338 11.0444 17.464 11.2347C18.2951 11.4249 19.0098 11.8191 19.608 12.4173C20.0862 12.8964 20.4551 13.4436 20.7147 14.0587C20.9742 14.6738 21.1036 15.3182 21.1027 15.992C21.1027 16.2827 21.0831 16.5591 21.044 16.8213C21.0049 17.0836 20.9347 17.3489 20.8333 17.6173C20.7791 17.7818 20.7849 17.9431 20.8507 18.1013C20.9164 18.2596 21.02 18.3684 21.1613 18.428C21.3089 18.4876 21.4591 18.4876 21.612 18.428C21.7649 18.3684 21.8684 18.2564 21.9227 18.092C22.0338 17.7587 22.1218 17.4156 22.1867 17.0627C22.2507 16.7098 22.2827 16.3556 22.2827 16C22.2827 15.1627 22.1258 14.364 21.812 13.604C21.4982 12.844 21.0449 12.1676 20.452 11.5747C19.7604 10.8662 18.9364 10.3898 17.98 10.1453C17.0244 9.9 16.0533 9.77733 15.0667 9.77733L16.36 8.484C16.4684 8.36933 16.5271 8.23422 16.536 8.07867C16.5449 7.92311 16.4836 7.77956 16.352 7.648C16.2204 7.51644 16.0809 7.45111 15.9333 7.452C15.7858 7.45289 15.6467 7.51822 15.516 7.648L13.4853 9.68C13.2693 9.896 13.1613 10.1476 13.1613 10.4347C13.1613 10.7218 13.2693 10.9729 13.4853 11.188L15.516 13.2187C15.6307 13.3342 15.7658 13.396 15.9213 13.404C16.0769 13.412 16.2204 13.3507 16.352 13.22C16.4836 13.0893 16.5493 12.9498 16.5493 12.8013C16.5493 12.6529 16.4836 12.5138 16.352 12.384L14.9187 10.9493ZM16 28C14.3431 28 12.7849 27.6844 11.3253 27.0533C9.86578 26.4213 8.596 25.5653 7.516 24.4853C6.43511 23.4044 5.57911 22.1342 4.948 20.6747C4.316 19.2151 4 17.6569 4 16C4 14.3431 4.31556 12.7849 4.94667 11.3253C5.57778 9.86578 6.43422 8.596 7.516 7.516C8.59778 6.436 9.86756 5.57956 11.3253 4.94667C12.7858 4.31556 14.344 4 16 4C17.656 4 19.2142 4.31556 20.6747 4.94667C22.1342 5.57867 23.404 6.43511 24.484 7.516C25.5649 8.596 26.4209 9.86578 27.052 11.3253C27.684 12.7858 28 14.344 28 16C28 17.656 27.6844 19.2142 27.0533 20.6747C26.4213 22.1342 25.5653 23.404 24.4853 24.484C23.4044 25.5649 22.1342 26.4209 20.6747 27.052C19.2151 27.684 17.6569 28 16 28ZM16 26.6667C18.9778 26.6667 21.5 25.6333 23.5667 23.5667C25.6333 21.5 26.6667 18.9778 26.6667 16C26.6667 13.0222 25.6333 10.5 23.5667 8.43333C21.5 6.36667 18.9778 5.33333 16 5.33333C13.0222 5.33333 10.5 6.36667 8.43333 8.43333C6.36667 10.5 5.33333 13.0222 5.33333 16C5.33333 18.9778 6.36667 21.5 8.43333 23.5667C10.5 25.6333 13.0222 26.6667 16 26.6667Z" fill="#414B55"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">전환율 (%)</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats ? (
                selectedEvent === '전체' ? (
                  // 전체 이벤트의 경우 모든 이벤트의 평균 전환율 계산
                  stats.events.length > 0 ? (
                    ((stats.events.reduce((sum, event) => sum + (event.couponUsed || 0), 0) / 
                      Math.max(stats.events.reduce((sum, event) => sum + (event.couponIssued || 0), 0), 1)) * 100).toFixed(1) + '%'
                  ) : '0.0%'
                ) : (
                  // 특정 이벤트 선택 시
                  selectedEventStats ? (
                    ((selectedEventStats.couponUsed / Math.max(selectedEventStats.couponIssued, 1)) * 100).toFixed(1) + '%'
                  ) : '0.0%'
                )
              ) : '0.0%'}
            </div>
            <div className="text-sm text-gray-500">발급 대비 사용 비율</div>
          </div>

          {/* 이벤트 유입수 */}
          <div className="bg-gray-50 rounded border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded flex items-center justify-center mr-3" style={{ backgroundColor: '#EBF1FF' }}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.875 26.25C13.5065 26.25 10.3434 24.7594 8.19653 22.1597L9.64216 20.9653C10.5209 22.0328 11.6253 22.8922 12.876 23.4818C14.1266 24.0713 15.4923 24.3764 16.875 24.375C22.0443 24.375 26.25 20.1694 26.25 15C26.25 9.83063 22.0443 5.62501 16.875 5.62501C15.4923 5.62362 14.1266 5.92869 12.876 6.51826C11.6253 7.10783 10.5209 7.96725 9.64216 9.0347L8.19653 7.84032C9.25081 6.55944 10.576 5.52825 12.0766 4.82097C13.5772 4.1137 15.216 3.74793 16.875 3.75001C23.0784 3.75001 28.125 8.79657 28.125 15C28.125 21.2034 23.0784 26.25 16.875 26.25Z" fill="#4D82F3"/>
                  <path d="M21.5625 15L15 8.4375L13.6744 9.76312L17.9738 14.0625H1.875V15.9375H17.9738L13.6744 20.2369L15 21.5625L21.5625 15Z" fill="#4D82F3"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">이벤트 유입수</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats ? (
                selectedEvent === '전체' ? (
                  formatNumber(stats.events.reduce((sum, event) => sum + (event.totalInflow || 0), 0))
                ) : (
                  selectedEventStats ? formatNumber(selectedEventStats.totalInflow) : '0'
                )
              ) : '0'}
            </div>
            <div className="text-sm text-gray-500">총 방문자 수</div>
          </div>

          {/* 쿠폰 발급 수 */}
          <div className="bg-gray-50 rounded border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded flex items-center justify-center mr-3" style={{ backgroundColor: '#E7FFE6' }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.25 8.66797L9.74996 15.168M11.7801 23.306L9.58096 22.0006C9.02196 21.6691 8.74354 21.5033 8.43263 21.4946C8.09896 21.4838 7.81513 21.6431 7.21171 22.0006C6.53571 22.4014 5.19238 23.5064 4.32354 22.9799C3.79163 22.6571 3.79163 21.8381 3.79163 20.2011V8.66797C3.79163 5.6043 3.79163 4.07139 4.74388 3.12022C5.69504 2.16797 7.22796 2.16797 10.2916 2.16797H15.7083C18.772 2.16797 20.3049 2.16797 21.256 3.12022C22.2083 4.07139 22.2083 5.6043 22.2083 8.66797V20.2011C22.2083 21.8381 22.2083 22.6571 21.6775 22.9799C20.8075 23.5064 19.4642 22.4014 18.7882 22.0006C18.2303 21.6691 17.9508 21.5033 17.642 21.4946C17.3062 21.4838 17.0224 21.6431 16.42 22.0006L14.2209 23.306C13.6272 23.6581 13.3304 23.8346 13 23.8346C12.6695 23.8346 12.3727 23.6581 11.7801 23.306Z" stroke="#5EC269" strokeWidth="1.625" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.25 15.168H16.2403M9.75975 8.66797H9.75" stroke="#5EC269" strokeWidth="2.16667" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">쿠폰 발급 수</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats ? (
                selectedEvent === '전체' ? (
                  formatNumber(stats.events.reduce((sum, event) => sum + (event.couponIssued || 0), 0))
                ) : (
                  selectedEventStats ? formatNumber(selectedEventStats.couponIssued) : '0'
                )
              ) : '0'}
            </div>
            <div className="text-sm text-gray-500">발급된 쿠폰 수</div>
          </div>

          {/* 쿠폰 사용 수 */}
          <div className="bg-gray-50 rounded border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded flex items-center justify-center mr-3" style={{ backgroundColor: '#F3E9FF' }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.0833 17.3346V19.5013H11.9166V17.3346H14.0833ZM17.3333 14.0846H19.5V11.918H17.3333V14.0846ZM19.5 22.7513H17.3333V24.918H19.5V22.7513ZM22.75 17.3346V19.5013H24.9166V17.3346H22.75ZM21.6666 14.0846C21.9539 14.0846 22.2295 14.1988 22.4327 14.4019C22.6358 14.6051 22.75 14.8807 22.75 15.168H24.9166C24.9166 14.306 24.5742 13.4794 23.9647 12.8699C23.3552 12.2604 22.5286 11.918 21.6666 11.918V14.0846ZM22.75 21.668C22.75 21.9553 22.6358 22.2308 22.4327 22.434C22.2295 22.6372 21.9539 22.7513 21.6666 22.7513V24.918C22.5286 24.918 23.3552 24.5756 23.9647 23.9661C24.5742 23.3566 24.9166 22.5299 24.9166 21.668H22.75ZM15.1666 22.7513C14.8793 22.7513 14.6038 22.6372 14.4006 22.434C14.1974 22.2308 14.0833 21.9553 14.0833 21.668H11.9166C11.9166 22.5299 12.259 23.3566 12.8685 23.9661C13.478 24.5756 14.3047 24.918 15.1666 24.918V22.7513ZM18.6441 17.1071C18.2381 17.5136 17.6873 17.7422 17.1127 17.7426C16.5382 17.743 15.9871 17.5152 15.5805 17.1093L15.5783 17.1071L10.8333 12.3621L9.28413 13.9221C9.58638 14.4703 9.74671 15.0846 9.74996 15.7096C9.74996 16.4596 9.52758 17.1926 9.11095 17.8162C8.69432 18.4397 8.10214 18.9257 7.4093 19.2127C6.71647 19.4997 5.95409 19.5748 5.21858 19.4284C4.48307 19.2821 3.80746 18.921 3.27718 18.3908C2.74691 17.8605 2.38579 17.1849 2.23948 16.4494C2.09318 15.7138 2.16827 14.9515 2.45525 14.2586C2.74223 13.5658 3.22822 12.9736 3.85176 12.557C4.47529 12.1403 5.20837 11.918 5.95829 11.918C6.58372 11.9212 7.19832 12.0814 7.74579 12.3838L9.30579 10.8346L7.74579 9.28547C7.19832 9.58786 6.58372 9.74803 5.95829 9.7513C5.20837 9.7513 4.47529 9.52893 3.85176 9.11229C3.22822 8.69566 2.74223 8.10348 2.45525 7.41065C2.16827 6.71781 2.09318 5.95543 2.23948 5.21992C2.38579 4.48441 2.74691 3.8088 3.27718 3.27852C3.80746 2.74825 4.48307 2.38713 5.21858 2.24083C5.95409 2.09452 6.71647 2.16961 7.4093 2.45659C8.10214 2.74358 8.69432 3.22956 9.11095 3.8531C9.52758 4.47664 9.74996 5.20972 9.74996 5.95964C9.74669 6.58506 9.58652 7.19967 9.28413 7.74714L10.8333 9.30714L15.0366 5.1038C15.4427 4.69733 15.9935 4.46876 16.568 4.46835C17.1425 4.46794 17.6937 4.69574 18.1003 5.10164L18.1025 5.1038L12.3608 10.8346L18.6441 17.1071ZM5.95829 7.58464C6.17176 7.58457 6.38313 7.54245 6.58032 7.46069C6.77751 7.37894 6.95667 7.25914 7.10757 7.10814C7.25846 6.95715 7.37814 6.77791 7.45976 6.58066C7.54139 6.38342 7.58337 6.17202 7.58329 5.95855C7.58322 5.74509 7.54111 5.53372 7.45935 5.33653C7.37759 5.13933 7.2578 4.96018 7.1068 4.80928C6.95581 4.65839 6.77657 4.53871 6.57932 4.45708C6.38207 4.37546 6.17068 4.33348 5.95721 4.33355C5.52609 4.3337 5.11268 4.5051 4.80794 4.81005C4.50319 5.115 4.33207 5.52852 4.33221 5.95964C4.33236 6.39076 4.50375 6.80416 4.8087 7.10891C5.11365 7.41366 5.52717 7.58478 5.95829 7.58464ZM7.58329 15.7096C7.58322 15.4962 7.54111 15.2848 7.45935 15.0876C7.37759 14.8904 7.2578 14.7113 7.1068 14.5604C6.95581 14.4095 6.77657 14.2898 6.57932 14.2082C6.38207 14.1265 6.17068 14.0846 5.95721 14.0846C5.74374 14.0847 5.53238 14.1268 5.33518 14.2086C5.13799 14.2903 4.95883 14.4101 4.80794 14.5611C4.65704 14.7121 4.53737 14.8914 4.45574 15.0886C4.37412 15.2859 4.33214 15.4973 4.33221 15.7107C4.33236 16.1418 4.50375 16.5552 4.8087 16.86C5.11365 17.1647 5.52717 17.3359 5.95829 17.3357C6.38942 17.3356 6.80282 17.1642 7.10757 16.8592C7.41231 16.5543 7.58344 16.1408 7.58329 15.7096Z" fill="#9D59EF"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">쿠폰 사용 수</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats ? (
                selectedEvent === '전체' ? (
                  formatNumber(stats.events.reduce((sum, event) => sum + (event.couponUsed || 0), 0))
                ) : (
                  selectedEventStats ? formatNumber(selectedEventStats.couponUsed) : '0'
                )
              ) : '0'}
            </div>
            <div className="text-sm text-gray-500">사용된 쿠폰 수</div>
          </div>
        </div>
      </section>


      {/* 시간대별 이벤트 현황 */}
      <section className="bg-white p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            시간대별 이벤트 현황 ({(() => {
              // 커스텀 날짜가 설정된 경우
              if (customStartDate && customEndDate) {
                if (customStartDate === customEndDate) {
                  return format(new Date(customStartDate), 'yyyy.MM.dd');
                } else {
                  return `${format(new Date(customStartDate), 'yyyy.MM.dd')} ~ ${format(new Date(customEndDate), 'yyyy.MM.dd')}`;
                }
              }
              
              // 기본 기간별 표시
              const today = new Date();
              switch (selectedPeriod) {
                case 'today':
                  return format(today, 'yyyy.MM.dd');
                case 'thisWeek':
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - 6);
                  return `${format(weekStart, 'yyyy.MM.dd')} ~ ${format(today, 'yyyy.MM.dd')}`;
                case 'thisMonth':
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  return `${format(monthStart, 'yyyy.MM.dd')} ~ ${format(monthEnd, 'yyyy.MM.dd')}`;
                default:
                  return '전체 기간';
              }
            })()})
          </h2>
          {/* 차트 타입 버튼들과 범례 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'inflow', 'issuance', 'usage'] as ChartType[]).map((type) => {
                const labels: Record<ChartType, string> = {
                  all: '전체',
                  inflow: '유입',
                  issuance: '발급',
                  usage: '사용',
                };
                return (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                      chartType === type
                        ? 'text-white'
                        : 'hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: chartType === type ? '#414B55' : '#F3F4F6',
                      color: chartType === type ? '#FFFFFF' : '#8E8E8E'
                    }}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
            {/* 범례 - 오른쪽 끝 배치 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">유입</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">발급</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">사용</span>
              </div>
            </div>
          </div>
        </div>

        {/* 바 차트 */}
        {chartData.length > 0 ? (
          <div className="overflow-x-auto pt-4">
            {chartType === 'all' ? (
              <>
                {/* 전체 차트 - 그룹형 바 */}
                <div className="flex min-w-full items-end justify-between gap-1">
                  {chartData.map((data, index) => {
                    const inflowHeight = maxValue > 0 ? (data.inflow / maxValue) * 200 : 0;
                    const issuanceHeight = maxValue > 0 ? (data.issuance / maxValue) * 200 : 0;
                    const usageHeight = maxValue > 0 ? (data.usage / maxValue) * 200 : 0;

                    return (
                      <div key={index} className="flex flex-1 flex-col items-center gap-1 min-w-[30px]">
                        <div 
                          className="relative flex w-full items-end justify-center gap-0.5 cursor-pointer" 
                          style={{ minHeight: '200px' }}
                          onMouseEnter={(e) => handleMouseEnter(e, data)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className="flex-1 rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                            style={{ 
                              height: `${inflowHeight}px`, 
                              minHeight: inflowHeight > 0 ? '4px' : '0' 
                            }}
                          />
                          <div
                            className="flex-1 rounded-t bg-green-500 transition-all hover:bg-green-600"
                            style={{ 
                              height: `${issuanceHeight}px`, 
                              minHeight: issuanceHeight > 0 ? '4px' : '0' 
                            }}
                          />
                          <div
                            className="flex-1 rounded-t bg-purple-500 transition-all hover:bg-purple-600"
                            style={{ 
                              height: `${usageHeight}px`, 
                              minHeight: usageHeight > 0 ? '4px' : '0' 
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-600 whitespace-nowrap">{data.hour}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex min-w-full items-end justify-between gap-1">
                {chartData.map((data, index) => {
                  const value = chartType === 'inflow' ? data.inflow : chartType === 'issuance' ? data.issuance : data.usage;
                  const height = maxValue > 0 ? (value / maxValue) * 200 : 0; // 최대 높이 200px
                  
                  // 차트 타입에 따른 색상 설정
                  const getBarColor = () => {
                    switch (chartType) {
                      case 'inflow':
                        return 'bg-blue-500 hover:bg-blue-600';
                      case 'issuance':
                        return 'bg-green-500 hover:bg-green-600';
                      case 'usage':
                        return 'bg-purple-500 hover:bg-purple-600';
                      default:
                        return 'bg-gray-400 hover:bg-gray-500';
                    }
                  };

                  return (
                    <div key={index} className="flex flex-1 flex-col items-center gap-1 min-w-[30px]">
                      <div 
                        className="relative w-full cursor-pointer"
                        onMouseEnter={(e) => handleMouseEnter(e, data)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div
                          className={`w-full rounded-t transition-all ${getBarColor()}`}
                          style={{ height: `${height}px`, minHeight: height > 0 ? '4px' : '0' }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-600 whitespace-nowrap">{data.hour}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
                <div className="pt-4 text-center text-gray-500">
            <p>차트 데이터가 없습니다.</p>
          </div>
        )}
      </section>

      {/* Store별 검증 현황 - 개별 이벤트 선택 시에만 표시 */}
      {selectedEvent !== '전체' && selectedEventStats && selectedEventStats.storeStats && selectedEventStats.storeStats.length > 0 && (
        <section className="bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            사용처별 쿠폰 사용 현황 ({(() => {
              // 커스텀 날짜가 설정된 경우
              if (customStartDate && customEndDate) {
                if (customStartDate === customEndDate) {
                  return format(new Date(customStartDate), 'yyyy.MM.dd');
                } else {
                  return `${format(new Date(customStartDate), 'yyyy.MM.dd')} ~ ${format(new Date(customEndDate), 'yyyy.MM.dd')}`;
                }
              }
              
              // 기본 기간별 표시
              const today = new Date();
              switch (selectedPeriod) {
                case 'today':
                  return format(today, 'yyyy.MM.dd');
                case 'thisWeek':
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - 6);
                  return `${format(weekStart, 'yyyy.MM.dd')} ~ ${format(today, 'yyyy.MM.dd')}`;
                case 'thisMonth':
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  return `${format(monthStart, 'yyyy.MM.dd')} ~ ${format(monthEnd, 'yyyy.MM.dd')}`;
                default:
                  return '전체 기간';
              }
            })()})
          </h2>
          
          {/* Store별 검증 수 요약 - 클릭 가능한 카드 */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {/* 전체 옵션 */}
            <button
              onClick={() => setSelectedStoreIds(new Set())}
              className="rounded border px-3 py-2 text-left transition-all flex items-center justify-between"
              style={{
                backgroundColor: selectedStoreIds.size === 0 ? '#F3F7FF' : '#F8F9FA',
                borderColor: selectedStoreIds.size === 0 ? '#4D82F3' : '#E3E3E3'
              }}
            >
              <span className="text-sm font-medium" style={{ color: '#8E8E8E' }}>전체</span>
              <span className="text-lg font-bold" style={{ color: '#414B55' }}>
                {selectedEventStats.storeStats.reduce((sum, store) => sum + store.validationCount, 0).toLocaleString()}건
              </span>
            </button>

            {/* Store별 카드 */}
            {selectedEventStats.storeStats.map((store, index) => {
              const isSelected = selectedStoreIds.has(store.id);
              const isOnlySelected = selectedStoreIds.size === 1 && selectedStoreIds.has(store.id);

              const handleClick = () => {
                if (isOnlySelected) {
                  // 이미 선택된 것을 다시 클릭하면 전체로
                  setSelectedStoreIds(new Set());
                } else {
                  // 하나만 선택
                  setSelectedStoreIds(new Set([store.id]));
                }
              };

              return (
                <button
                  key={store.id}
                  onClick={handleClick}
                  className="rounded border px-3 py-2 text-left transition-all flex items-center justify-between"
                  style={{
                    backgroundColor: isSelected ? '#F3F7FF' : '#F8F9FA',
                    borderColor: isSelected ? '#4D82F3' : '#E3E3E3'
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: '#8E8E8E' }}>{store.name}</span>
                  <span className="text-lg font-bold" style={{ color: '#414B55' }}>
                    {store.validationCount.toLocaleString()}건
                  </span>
                </button>
              );
            })}
          </div>

          {/* 통합 Store별 시간대별 검증 차트 */}
          <div className="pt-6">
            {/* 통합 차트 */}
            <div className="overflow-x-auto">
              <div className="flex min-w-full items-end justify-between gap-1 pb-2">
                {Array.from({ length: 24 }, (_, hourIndex) => {
                  const hour = hourIndex;
                  const hourLabel = `${hour}시`;
                  
                  // 필터링된 store만 표시 (전체면 모든 store)
                  const storesToShow = selectedStoreIds.size === 0
                    ? selectedEventStats.storeStats!
                    : selectedEventStats.storeStats!.filter((store) => selectedStoreIds.has(store.id));
                  
                  // 해당 시간대의 store 검증 수
                  const hourData = storesToShow.map((store, storeIndex) => {
                    const hourData = store.hourlyValidation.find((h) => h.hour === hourLabel);
                    return {
                      storeId: store.id,
                      storeName: store.name,
                      count: hourData?.count || 0,
                      originalIndex: selectedEventStats.storeStats!.findIndex((s) => s.id === store.id),
                    };
                  });
                  
                  // 최대값 계산 (전체 시간대 중 최대)
                  const allCounts = storesToShow.flatMap((store) =>
                    store.hourlyValidation.map((h) => h.count)
                  );
                  const maxCount = Math.max(...allCounts, 1);
                  
                  return (
                    <div key={hourIndex} className="flex flex-1 flex-col items-center gap-1 min-w-[30px]">
                      <div className="relative flex w-full items-end justify-center gap-0.5" style={{ minHeight: '150px' }}>
                        {hourData.map((data) => {
                          const height = maxCount > 0 ? (data.count / maxCount) * 150 : 0;
                          
                          return (
                            <div
                              key={data.storeId}
                              className="flex-1"
                              title={`${data.storeName}: ${data.count}건`}
                            >
                              <div
                                className="w-full rounded-t transition-all bg-purple-500 hover:bg-purple-600"
                                style={{ 
                                  height: `${height}px`, 
                                  minHeight: height > 0 ? '4px' : '0' 
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-gray-600 whitespace-nowrap">{hourLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 툴팁 */}
      {tooltip.show && tooltip.data && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-sm font-semibold text-gray-900 mb-2">
            {tooltip.data.hour}
          </div>
          <div className="space-y-1 text-xs">
            {chartType === 'all' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">유입</span>
                  <span className="font-medium text-blue-600">{tooltip.data.inflow}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">발급</span>
                  <span className="font-medium text-green-600">{tooltip.data.issuance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">사용</span>
                  <span className="font-medium text-purple-600">{tooltip.data.usage}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {chartType === 'inflow' ? '유입' :
                   chartType === 'issuance' ? '발급' : '사용'}
                </span>
                <span className={`font-medium ${
                  chartType === 'inflow' ? 'text-blue-600' :
                  chartType === 'issuance' ? 'text-green-600' : 'text-purple-600'
                }`}>
                  {chartType === 'inflow' ? tooltip.data.inflow :
                   chartType === 'issuance' ? tooltip.data.issuance : tooltip.data.usage}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
