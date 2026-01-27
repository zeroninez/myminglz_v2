'use client';

import Link from 'next/link';

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

interface EventInfoItemProps {
  label: string;
  value: string;
}

function EventInfoItem({ label, value }: EventInfoItemProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-black"></div>
        <span className="text-xs text-gray-900">{label}</span>
      </div>
      <p className="text-sm text-[#8E8E8E]">{value}</p>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  diff?: number;
  showDiff?: boolean;
}

function StatItem({ label, value, diff = 0, showDiff = false }: StatItemProps) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-blue-600">{value}</div>
        {showDiff && diff !== 0 ? (
          <span className="px-2 py-0.5 bg-[#F3F7FF] text-blue-600 text-xs font-medium rounded-full">
            어제보다 {Math.abs(diff)}<span className="text-red-600">{diff > 0 ? '▲' : '▼'}</span>
          </span>
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#F3F7FF] flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-blue-400"></div>
          </div>
        )}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  stats?: EventStats;
  baseUrl: string;
}

export default function EventCard({ event, stats, baseUrl }: EventCardProps) {
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const calculateDaysUntilEnd = (endDate: string | null): number | null => {
    if (!endDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilEnd = calculateDaysUntilEnd(event.end_date);
  const stores = event.event_info_config?.stores || [];
  const storeCount = stores.length;
  const storeDisplay = storeCount === 0
    ? '사용처 없음'
    : storeCount === 1
    ? stores[0].name
    : `${stores[0].name} 외 ${storeCount - 1}곳`;

  const totalInflowDiff = stats
    ? (stats.totalInflowToday || 0) - (stats.totalInflowYesterday || 0)
    : 0;
  const couponIssuedDiff = stats
    ? (stats.couponIssuedToday || 0) - (stats.couponIssuedYesterday || 0)
    : 0;
  const couponUsedDiff = stats
    ? (stats.couponUsedToday || 0) - (stats.couponUsedYesterday || 0)
    : 0;

  const eventUrl = `${baseUrl}/${event.domain_code}`;

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex">
        {/* 좌측: 제목, 종료일, 버튼 */}
        <div className="w-56 flex-shrink-0 flex flex-col justify-between bg-[#F8F9FA] py-4 px-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-xl font-bold text-gray-900">{event.name}</h4>
            {daysUntilEnd !== null && (
              <span className="text-sm text-gray-600">
                종료일까지 D-{daysUntilEnd}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white text-gray-800 rounded border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-center"
            >
              미리보기
            </a>
            <Link
              href={`/create/${event.id}`}
              className="px-3 py-1.5 bg-white text-gray-800 rounded border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-center"
            >
              수정하기
            </Link>
          </div>
        </div>

        {/* 우측: 상세 정보 */}
        <div className="flex-1 flex flex-col p-6">
          {/* 상단: 생성일, 이벤트 기간, 사용처 */}
          <div className="grid grid-cols-3 gap-6 mb-4">
            <EventInfoItem label="생성일" value={formatDateTime(event.created_at)} />
            <EventInfoItem 
              label="이벤트 기간" 
              value={event.start_date && event.end_date
                ? `${formatDate(event.start_date)}~${formatDate(event.end_date)}`
                : '-'} 
            />
            <EventInfoItem label="사용처" value={storeDisplay} />
          </div>

          {/* 구분선 */}
          <div className="border-b border-gray-200 mb-4"></div>

          {/* 하단: 통계 */}
          <div className="grid grid-cols-3 gap-6">
            <StatItem label="이벤트 참여수" value={stats?.totalInflow || 0} diff={totalInflowDiff} showDiff />
            <StatItem label="쿠폰 발급 수" value={stats?.couponIssued || 0} diff={couponIssuedDiff} showDiff />
            <StatItem label="쿠폰 사용 수" value={stats?.couponUsed || 0} diff={couponUsedDiff} showDiff />
          </div>
        </div>
      </div>
    </div>
  );
}

