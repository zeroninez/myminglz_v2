'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('전체');
  const [qrCode, setQrCode] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('전체');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [chartType, setChartType] = useState<ChartType>('all');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedEventStats, setSelectedEventStats] = useState<EventStats | null>(null);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set()); // 'all'은 빈 Set으로 표시

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
          console.error('에러 상세:', result.details);
          console.error('에러 코드:', result.code);
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
  const fetchStats = useCallback(async () => {
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
  }, [selectedEvent, selectedPeriod, dateRange]);

  // 이벤트 로드 완료 시 및 필터 변경 시 통계 데이터 자동 조회
  useEffect(() => {
    if (events.length > 0) {
      fetchStats();
    }
  }, [events.length, fetchStats]);

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
    setQrCode('');
    setDateRange('전체');
    setSelectedPeriod('all');
    setChartType('all');
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
  const chartData = selectedEventStats?.hourlyData || stats?.events[0]?.hourlyData || [];
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
            <label className="mb-2 block text-sm font-medium text-gray-700">QR 코드 검색 (?)</label>
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
            이벤트 전체 통계 {selectedPeriod === 'all' ? '(전체 기간)' : `(${getCurrentDate()}일 기준)`}
          </h2>
        </div>
        <div className="flex gap-2">
          {(['all', 'yesterday', 'today', 'thisWeek', 'thisMonth'] as TimePeriod[]).map((period) => {
            const labels: Record<TimePeriod, string> = {
              all: '전체 기간',
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
        selectedEvent !== '전체' && selectedEventStats ? (
          // 단일 이벤트 선택 시: 피그마 형식
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {/* 이벤트 정보 헤더 */}
            <div className="mb-6 rounded-lg bg-gray-100 px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                <span className="font-medium">
                  이벤트 이름 : <span className="font-normal">{selectedEventStats.name}</span>
                </span>
                <span className="font-medium">
                  이벤트 기간: <span className="font-normal">
                    {selectedEventStats.startDate && selectedEventStats.endDate
                      ? `${formatDate(selectedEventStats.startDate)} ~ ${formatDate(selectedEventStats.endDate)}`
                      : '미설정'}
                  </span>
                </span>
                <span className="font-medium">
                  사용처 : <span className="font-normal">{selectedEventStats.storesCount || 0} Places</span>
                </span>
              </div>
            </div>

            {/* 평균 이벤트 현황 */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">평균 이벤트 현황</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        전환율(%)
                      </th>
                      <th className="border-b border-r border-l border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        총 유입 수
                      </th>
                      <th className="border-b border-r border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        쿠폰 발급 수
                      </th>
                      <th className="border-b border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        쿠폰 사용 수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-6 py-4 text-base font-medium text-gray-900">
                        {selectedEventStats.conversionRate}%
                      </td>
                      <td className="border-l border-r border-gray-200 px-6 py-4 text-base font-medium text-gray-900">
                        {formatNumber(selectedEventStats.totalInflow)}
                      </td>
                      <td className="border-r border-gray-200 px-6 py-4 text-base font-medium text-gray-900">
                        {formatNumber(selectedEventStats.couponIssued)}
                      </td>
                      <td className="px-6 py-4 text-base font-medium text-gray-900">
                        {formatNumber(selectedEventStats.couponUsed)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : (
          // 전체 조회 시: 최고/최저 성과 이벤트
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
        )
      ) : null}

      {/* 시간대별 이벤트 현황 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">시간대별 이벤트 현황</h3>
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
            {chartType === 'all' ? (
              <>
                {/* 범례 */}
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-blue-500" />
                    <span className="text-sm text-gray-700">유입</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-green-500" />
                    <span className="text-sm text-gray-700">발급</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-purple-500" />
                    <span className="text-sm text-gray-700">사용</span>
                  </div>
                </div>

                {/* 전체 차트 - 그룹형 바 */}
                <div className="flex min-w-full items-end justify-between gap-1">
                  {chartData.map((data, index) => {
                    const inflowHeight = maxValue > 0 ? (data.inflow / maxValue) * 200 : 0;
                    const issuanceHeight = maxValue > 0 ? (data.issuance / maxValue) * 200 : 0;
                    const usageHeight = maxValue > 0 ? (data.usage / maxValue) * 200 : 0;

                    return (
                      <div key={index} className="flex flex-1 flex-col items-center gap-1 min-w-[30px]">
                        <div className="relative flex w-full items-end justify-center gap-0.5" style={{ minHeight: '200px' }}>
                          <div
                            className="flex-1 rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                            style={{ 
                              height: `${inflowHeight}px`, 
                              minHeight: inflowHeight > 0 ? '4px' : '0' 
                            }}
                            title={`유입: ${data.inflow}건`}
                          />
                          <div
                            className="flex-1 rounded-t bg-green-500 transition-all hover:bg-green-600"
                            style={{ 
                              height: `${issuanceHeight}px`, 
                              minHeight: issuanceHeight > 0 ? '4px' : '0' 
                            }}
                            title={`발급: ${data.issuance}건`}
                          />
                          <div
                            className="flex-1 rounded-t bg-purple-500 transition-all hover:bg-purple-600"
                            style={{ 
                              height: `${usageHeight}px`, 
                              minHeight: usageHeight > 0 ? '4px' : '0' 
                            }}
                            title={`사용: ${data.usage}건`}
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
            )}
          </div>
        ) : (
          <div className="border-t border-gray-200 pt-4 text-center text-gray-500">
            <p>차트 데이터가 없습니다.</p>
          </div>
        )}
      </section>

      {/* Store별 검증 현황 */}
      {selectedEventStats && selectedEventStats.storeStats && selectedEventStats.storeStats.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Store별 검증 현황</h3>
          
          {/* Store별 검증 수 요약 - 클릭 가능한 카드 */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* 전체 옵션 */}
            <button
              onClick={() => setSelectedStoreIds(new Set())}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                selectedStoreIds.size === 0
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="relative h-4 w-4 rounded border-2 border-gray-400 bg-white">
                  {selectedStoreIds.size === 0 && (
                    <svg className="absolute inset-0 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">전체</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedEventStats.storeStats.reduce((sum, store) => sum + store.validationCount, 0).toLocaleString()}
                <span className="ml-1 text-sm font-normal text-gray-500">건</span>
              </div>
            </button>

            {/* Store별 카드 */}
            {selectedEventStats.storeStats.map((store, index) => {
              const colors = [
                { bg: 'bg-blue-500', bgHover: 'hover:bg-blue-600', border: 'border-blue-500', bgLight: 'bg-blue-50' },
                { bg: 'bg-green-500', bgHover: 'hover:bg-green-600', border: 'border-green-500', bgLight: 'bg-green-50' },
                { bg: 'bg-purple-500', bgHover: 'hover:bg-purple-600', border: 'border-purple-500', bgLight: 'bg-purple-50' },
                { bg: 'bg-orange-500', bgHover: 'hover:bg-orange-600', border: 'border-orange-500', bgLight: 'bg-orange-50' },
                { bg: 'bg-pink-500', bgHover: 'hover:bg-pink-600', border: 'border-pink-500', bgLight: 'bg-pink-50' },
                { bg: 'bg-yellow-500', bgHover: 'hover:bg-yellow-600', border: 'border-yellow-500', bgLight: 'bg-yellow-50' },
                { bg: 'bg-indigo-500', bgHover: 'hover:bg-indigo-600', border: 'border-indigo-500', bgLight: 'bg-indigo-50' },
                { bg: 'bg-red-500', bgHover: 'hover:bg-red-600', border: 'border-red-500', bgLight: 'bg-red-50' },
              ];
              const color = colors[index % colors.length];
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
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                      ? `${color.border} ${color.bgLight} shadow-md`
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div className={`relative h-4 w-4 rounded ${color.bg}`}>
                      {isSelected && (
                        <svg className="absolute inset-0 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-600">{store.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {store.validationCount.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-gray-500">건</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 통합 Store별 시간대별 검증 차트 */}
          <div className="border-t border-gray-200 pt-6">
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
                          const colors = [
                            { bg: 'bg-blue-500', bgHover: 'hover:bg-blue-600' },
                            { bg: 'bg-green-500', bgHover: 'hover:bg-green-600' },
                            { bg: 'bg-purple-500', bgHover: 'hover:bg-purple-600' },
                            { bg: 'bg-orange-500', bgHover: 'hover:bg-orange-600' },
                            { bg: 'bg-pink-500', bgHover: 'hover:bg-pink-600' },
                            { bg: 'bg-yellow-500', bgHover: 'hover:bg-yellow-600' },
                            { bg: 'bg-indigo-500', bgHover: 'hover:bg-indigo-600' },
                            { bg: 'bg-red-500', bgHover: 'hover:bg-red-600' },
                          ];
                          const color = colors[data.originalIndex % colors.length];
                          
                          const height = maxCount > 0 ? (data.count / maxCount) * 150 : 0;
                          
                          return (
                            <div
                              key={data.storeId}
                              className="flex-1"
                              title={`${data.storeName}: ${data.count}건`}
                            >
                              <div
                                className={`w-full rounded-t transition-all ${color.bg} ${color.bgHover}`}
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
    </div>
  );
}
