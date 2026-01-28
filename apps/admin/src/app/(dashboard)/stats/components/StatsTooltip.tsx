'use client';

type ChartType = 'all' | 'inflow' | 'issuance' | 'usage';

interface TooltipData {
  hour: string;
  inflow: number;
  issuance: number;
  usage: number;
}

interface StatsTooltipProps {
  show: boolean;
  x: number;
  y: number;
  data: TooltipData | null;
  chartType: ChartType;
}

export default function StatsTooltip({ show, x, y, data, chartType }: StatsTooltipProps) {
  if (!show || !data) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="text-sm font-semibold text-gray-900 mb-2">
        {data.hour}
      </div>
      <div className="space-y-1 text-xs">
        {chartType === 'all' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">유입</span>
              <span className="font-medium text-blue-600">{data.inflow}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">발급</span>
              <span className="font-medium text-green-600">{data.issuance}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">사용</span>
              <span className="font-medium text-purple-600">{data.usage}</span>
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
              {chartType === 'inflow' ? data.inflow :
               chartType === 'issuance' ? data.issuance : data.usage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}