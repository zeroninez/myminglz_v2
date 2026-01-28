'use client';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'chart' | 'stat';
  lines?: number;
}

export default function SkeletonLoader({ 
  className = '', 
  variant = 'text',
  lines = 1 
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  switch (variant) {
    case 'text':
      return (
        <div className={className}>
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i} 
              className={`${baseClasses} h-4 mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            />
          ))}
        </div>
      );
      
    case 'card':
      return (
        <div className={`${baseClasses} p-6 ${className}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      );
      
    case 'chart':
      return (
        <div className={`${className}`}>
          <div className="flex items-end justify-between h-64 px-4 py-6">
            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i}
                className={`${baseClasses} w-3`}
                style={{ height: `${Math.random() * 200 + 20}px` }}
              />
            ))}
          </div>
        </div>
      );
      
    case 'stat':
      return (
        <div className={`bg-gray-50 rounded border border-gray-200 p-6 ${className}`}>
          {/* 아이콘 + 제목 */}
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded bg-gray-300 mr-3"></div>
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </div>
          {/* 메인 숫자 */}
          <div className="text-3xl font-bold mb-2">
            <div className="h-8 bg-gray-300 rounded w-20"></div>
          </div>
          {/* 설명 텍스트 */}
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      );
      
    default:
      return <div className={`${baseClasses} h-4 ${className}`} />;
  }
}

// 통계 페이지 전용 스켈레톤
export function StatsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 평균 이벤트 현황 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} variant="stat" />
        ))}
      </div>
      
      {/* 시간대별 차트 스켈레톤 */}
      <div className="bg-white p-6 rounded border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <SkeletonLoader className="h-6 w-48" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} className="h-8 w-16" />
            ))}
          </div>
        </div>
        <SkeletonLoader variant="chart" />
      </div>
      
      {/* 사용처별 현황 스켈레톤 */}
      <div className="bg-white p-6 rounded border border-gray-200">
        <SkeletonLoader className="h-6 w-64 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-12 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}