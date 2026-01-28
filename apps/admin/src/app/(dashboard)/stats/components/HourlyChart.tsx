'use client';

import { format } from 'date-fns';
import SkeletonLoader from '@/components/SkeletonLoader';

type TimePeriod = 'all' | 'yesterday' | 'today' | 'thisWeek' | 'thisMonth';
type ChartType = 'all' | 'inflow' | 'issuance' | 'usage';

interface HourlyData {
  hour: string;
  inflow: number;
  issuance: number;
  usage: number;
}

interface HourlyChartProps {
  chartData: HourlyData[];
  chartType: ChartType;
  selectedPeriod: TimePeriod;
  customStartDate: string;
  customEndDate: string;
  statsLoading: boolean;
  isInitialLoad: boolean;
  onChartTypeChange: (type: ChartType) => void;
  onMouseEnter: (event: React.MouseEvent, data: HourlyData) => void;
  onMouseLeave: () => void;
}

export default function HourlyChart({
  chartData,
  chartType,
  selectedPeriod,
  customStartDate,
  customEndDate,
  statsLoading,
  isInitialLoad,
  onChartTypeChange,
  onMouseEnter,
  onMouseLeave
}: HourlyChartProps) {
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
    <section className="bg-white p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          시간대별 이벤트 현황 ({getDisplayDateRange()})
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
                  onClick={() => onChartTypeChange(type)}
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
      {isInitialLoad && statsLoading ? (
        <SkeletonLoader variant="chart" className="mt-4" />
      ) : chartData.length > 0 ? (
        <div className={`overflow-x-auto pt-4 ${statsLoading && !isInitialLoad ? 'relative' : ''}`}>
          {/* 로딩 오버레이 */}
          {statsLoading && !isInitialLoad && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">차트 업데이트 중...</span>
              </div>
            </div>
          )}
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
                        onMouseEnter={(e) => onMouseEnter(e, data)}
                        onMouseLeave={onMouseLeave}
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
                      onMouseEnter={(e) => onMouseEnter(e, data)}
                      onMouseLeave={onMouseLeave}
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
  );
}