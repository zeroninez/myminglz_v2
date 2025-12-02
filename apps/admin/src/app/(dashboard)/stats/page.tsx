'use client';

import { useState, useEffect } from 'react';

type TimePeriod = 'yesterday' | 'today' | 'thisWeek' | 'thisMonth';
type ChartType = 'inflow' | 'issuance' | 'usage';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface EventStats {
  id: string;
  name: string;
  domainCode: string;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('전체');
  const [qrCode, setQrCode] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('전체');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [chartType, setChartType] = useState<ChartType>('inflow');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedEventStats, setSelectedEventStats] = useState<EventStats | null>(null);

  // 이벤트 목록 가져오기
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const response = await fetch('/api/events', {
          cache: 'no-store', // 캐시 방지
        });
        const result = await response.json();

        if (!result.success) {
          console.error('이벤트 목록 로드 오류:', result.error);
          setEvents([]);
          return;
        }

        const eventsData = Array.isArray(result.data) ? result.data : [];
        setEvents(eventsData);
      } catch (err: any) {
        console.error('이벤트 목록 로드 오류:', err);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // 통계 데이터 가져오기
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedEvent !== '전체' && { eventId: selectedEvent }),
        ...(dateRange !== '전체' && { dateRange }),
      });

      const response = await fetch(`/api/stats?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        console.error('통계 데이터 로드 오류:', result.error);
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
    } finally {
      setStatsLoading(false);
    }
  };

  // 필터 변경 시 통계 데이터 다시 가져오기
  useEffect(() => {
    if (events.length > 0) {
      fetchStats();
    }
  }, [selectedEvent, selectedPeriod, dateRange]);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleReset = () => {
    setSelectedEvent('전체');
    setQrCode('');
    setDateRange('전체');
    setSelectedPeriod('today');
    setChartType('inflow');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  // 차트 데이터 (선택된 이벤트 또는 전체)
  const chartData = selectedEventStats?.hourlyData || stats?.events[0]?.hourlyData || [];
  const maxValue = Math.max(
    ...chartData.map((d) => {
      if (chartType === 'inflow') return d.inflow;
      if (chartType === 'issuance') return d.issuance;
      return d.usage;
    }),
    1
  );

  return (
    <div className="space-y-6">
      {/* 필터/검색 섹션 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">이벤트 이름 검색</label>
            <div className="relative">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                disabled={eventsLoading}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="전체">이벤트 전체</option>
                {eventsLoading ? (
                  <option value="" disabled>로딩 중...</option>
                ) : events.length === 0 ? (
                  <option value="" disabled>이벤트가 없습니다</option>
                ) : (
                  events.map((event) => (
                    <option key={event.id} value={event.id}>
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">QR 코드 검색</label>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="QR 코드"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">범위</label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="오늘">오늘</option>
                <option value="이번주">이번주</option>
                <option value="이번달">이번달</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={fetchStats}
              className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              조회하기
            </button>
          </div>
        </div>
      </section>

      {/* 이벤트 전체 통계 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            이벤트 전체 통계 ({getCurrentDate()}일 기준)
          </h2>
        </div>
        <div className="flex gap-2">
          {(['yesterday', 'today', 'thisWeek', 'thisMonth'] as TimePeriod[]).map((period) => {
            const labels: Record<TimePeriod, string> = {
              yesterday: '어제',
              today: '오늘',
              thisWeek: '이번주',
              thisMonth: '이번달',
            };
            return (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>
      </section>

      {/* 성과 이벤트 섹션 */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">통계 데이터 로딩 중...</span>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 최고 성과 이벤트 */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {stats.bestEvent ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  최고 성과 이벤트: {stats.bestEvent.name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 text-sm text-gray-600">전환율(%)</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.bestEvent.conversionRate}%</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">총 유입 수</div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.bestEvent.totalInflow)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">쿠폰 발급 수</div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.bestEvent.couponIssued)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">쿠폰 사용 수</div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.bestEvent.couponUsed)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>최고 성과 이벤트 데이터가 없습니다.</p>
              </div>
            )}
          </section>

          {/* 최저 성과 이벤트 */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {stats.worstEvent ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  최저 성과 이벤트: {stats.worstEvent.name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 text-sm text-gray-600">전환율(%)</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.worstEvent.conversionRate}%</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">총 유입 수</div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.worstEvent.totalInflow)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">쿠폰 발급 수</div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.worstEvent.couponIssued)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">쿠폰 사용 수</div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.worstEvent.couponUsed)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>최저 성과 이벤트 데이터가 없습니다.</p>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {/* 시간대별 이벤트 현황 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">시간대별 이벤트 현황</h3>
          <div className="flex gap-2">
            {(['inflow', 'issuance', 'usage'] as ChartType[]).map((type) => {
              const labels: Record<ChartType, string> = {
                inflow: '유입',
                issuance: '발급',
                usage: '사용',
              };
              return (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    chartType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 바 차트 */}
        {chartData.length > 0 ? (
          <div className="overflow-x-auto border-t border-gray-200 pt-4">
            <div className="flex min-w-full items-end justify-between gap-1">
              {chartData.map((data, index) => {
                const value = chartType === 'inflow' ? data.inflow : chartType === 'issuance' ? data.issuance : data.usage;
                const height = maxValue > 0 ? (value / maxValue) * 200 : 0; // 최대 높이 200px

                return (
                  <div key={index} className="flex flex-1 flex-col items-center gap-1 min-w-[30px]">
                    <div className="relative w-full">
                      <div
                        className="w-full rounded-t bg-gray-400 transition-all hover:bg-gray-500"
                        style={{ height: `${height}px`, minHeight: height > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-600 whitespace-nowrap">{data.hour}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 pt-4 text-center text-gray-500">
            <p>차트 데이터가 없습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
