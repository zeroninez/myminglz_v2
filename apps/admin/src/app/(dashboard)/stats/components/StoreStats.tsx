'use client';

import { format } from 'date-fns';

type TimePeriod = 'all' | 'yesterday' | 'today' | 'thisWeek' | 'thisMonth';

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

interface StoreStatsProps {
  selectedEvent: string;
  selectedEventStats: EventStats | null;
  selectedStoreIds: Set<string>;
  selectedPeriod: TimePeriod;
  customStartDate: string;
  customEndDate: string;
  onStoreSelectionChange: (storeIds: Set<string>) => void;
}

export default function StoreStats({
  selectedEvent,
  selectedEventStats,
  selectedStoreIds,
  selectedPeriod,
  customStartDate,
  customEndDate,
  onStoreSelectionChange
}: StoreStatsProps) {
  const getDisplayDateRange = () => {
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
  };

  if (selectedEvent === '전체' || !selectedEventStats || !selectedEventStats.storeStats || selectedEventStats.storeStats.length === 0) {
    return null;
  }

  return (
    <section className="bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        사용처별 쿠폰 사용 현황 ({getDisplayDateRange()})
      </h2>
      
      {/* Store별 검증 수 요약 - 클릭 가능한 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {/* 전체 옵션 */}
        <button
          onClick={() => onStoreSelectionChange(new Set())}
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
              onStoreSelectionChange(new Set());
            } else {
              // 하나만 선택
              onStoreSelectionChange(new Set([store.id]));
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
  );
}