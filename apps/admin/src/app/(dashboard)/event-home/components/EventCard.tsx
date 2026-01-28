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
  // 라벨에 따라 다른 아이콘 렌더링
  const renderIcon = () => {
    switch (label) {
      case '생성일':
        return (
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.0625 10.5C17.0625 10.326 17.1316 10.159 17.2547 10.036C17.3778 9.91289 17.5447 9.84375 17.7188 9.84375C17.8928 9.84375 18.0597 9.91289 18.1828 10.036C18.3059 10.159 18.375 10.326 18.375 10.5V17.7188C18.375 17.8928 18.3059 18.0597 18.1828 18.1828C18.0597 18.3059 17.8928 18.375 17.7188 18.375H3.28125C3.1072 18.375 2.94028 18.3059 2.81721 18.1828C2.69414 18.0597 2.625 17.8928 2.625 17.7188V3.28125C2.625 3.1072 2.69414 2.94028 2.81721 2.81721C2.94028 2.69414 3.1072 2.625 3.28125 2.625H10.5C10.674 2.625 10.841 2.69414 10.964 2.81721C11.0871 2.94028 11.1562 3.1072 11.1562 3.28125C11.1562 3.4553 11.0871 3.62222 10.964 3.74529C10.841 3.86836 10.674 3.9375 10.5 3.9375H3.9375V17.0625H17.0625V10.5Z" fill="black"/>
            <path d="M9.6384 11.3665L10.7212 11.2116L17.373 4.5612C17.4356 4.50067 17.4856 4.42825 17.52 4.34819C17.5544 4.26812 17.5725 4.18201 17.5733 4.09487C17.574 4.00774 17.5574 3.92132 17.5244 3.84067C17.4914 3.76002 17.4427 3.68675 17.3811 3.62513C17.3195 3.56352 17.2462 3.51479 17.1656 3.48179C17.0849 3.44879 16.9985 3.43219 16.9114 3.43295C16.8242 3.4337 16.7381 3.45181 16.658 3.4862C16.578 3.52059 16.5056 3.57059 16.445 3.63327L9.79196 10.2837L9.63709 11.3665H9.6384ZM18.3009 2.70402C18.4838 2.88685 18.629 3.10394 18.728 3.34288C18.827 3.58182 18.878 3.83793 18.878 4.09658C18.878 4.35523 18.827 4.61134 18.728 4.85028C18.629 5.08922 18.4838 5.30631 18.3009 5.48914L11.4956 12.2945C11.3952 12.3952 11.2649 12.4606 11.1241 12.4808L8.95852 12.7906C8.8576 12.8051 8.75468 12.7959 8.65794 12.7636C8.5612 12.7314 8.47329 12.6771 8.4012 12.605C8.3291 12.5329 8.27479 12.445 8.24258 12.3483C8.21038 12.2515 8.20115 12.1486 8.21565 12.0477L8.5254 9.88208C8.54529 9.74151 8.61022 9.61118 8.71046 9.51064L15.5171 2.70533C15.8863 2.33625 16.387 2.12891 16.909 2.12891C17.431 2.12891 17.9317 2.33625 18.3009 2.70533V2.70402Z" fill="black"/>
          </svg>
        );
      case '이벤트 기간':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.39961 13.2016C8.71787 13.2016 9.02309 13.0751 9.24814 12.8501C9.47318 12.625 9.59961 12.3198 9.59961 12.0016C9.59961 11.6833 9.47318 11.3781 9.24814 11.153C9.02309 10.928 8.71787 10.8016 8.39961 10.8016C8.08135 10.8016 7.77613 10.928 7.55108 11.153C7.32604 11.3781 7.19961 11.6833 7.19961 12.0016C7.19961 12.3198 7.32604 12.625 7.55108 12.8501C7.77613 13.0751 8.08135 13.2016 8.39961 13.2016ZM9.59961 15.6016C9.59961 15.9198 9.47318 16.225 9.24814 16.4501C9.02309 16.6751 8.71787 16.8016 8.39961 16.8016C8.08135 16.8016 7.77613 16.6751 7.55108 16.4501C7.32604 16.225 7.19961 15.9198 7.19961 15.6016C7.19961 15.2833 7.32604 14.9781 7.55108 14.753C7.77613 14.528 8.08135 14.4016 8.39961 14.4016C8.71787 14.4016 9.02309 14.528 9.24814 14.753C9.47318 14.9781 9.59961 15.2833 9.59961 15.6016ZM11.9996 13.2016C12.3179 13.2016 12.6231 13.0751 12.8481 12.8501C13.0732 12.625 13.1996 12.3198 13.1996 12.0016C13.1996 11.6833 13.0732 11.3781 12.8481 11.153C12.6231 10.928 12.3179 10.8016 11.9996 10.8016C11.6813 10.8016 11.3761 10.928 11.1511 11.153C10.926 11.3781 10.7996 11.6833 10.7996 12.0016C10.7996 12.3198 10.926 12.625 11.1511 12.8501C11.3761 13.0751 11.6813 13.2016 11.9996 13.2016ZM13.1996 15.6016C13.1996 15.9198 13.0732 16.225 12.8481 16.4501C12.6231 16.6751 12.3179 16.8016 11.9996 16.8016C11.6813 16.8016 11.3761 16.6751 11.1511 16.4501C10.926 16.225 10.7996 15.9198 10.7996 15.6016C10.7996 15.2833 10.926 14.9781 11.1511 14.753C11.3761 14.528 11.6813 14.4016 11.9996 14.4016C12.3179 14.4016 12.6231 14.528 12.8481 14.753C13.0732 14.9781 13.1996 15.2833 13.1996 15.6016ZM15.5996 13.2016C15.9179 13.2016 16.2231 13.0751 16.4481 12.8501C16.6732 12.625 16.7996 12.3198 16.7996 12.0016C16.7996 11.6833 16.6732 11.3781 16.4481 11.153C16.2231 10.928 15.9179 10.8016 15.5996 10.8016C15.2814 10.8016 14.9761 10.928 14.7511 11.153C14.526 11.3781 14.3996 11.6833 14.3996 12.0016C14.3996 12.3198 14.526 12.625 14.7511 12.8501C14.9761 13.0751 15.2814 13.2016 15.5996 13.2016ZM20.3996 6.60156C20.3996 5.80591 20.0835 5.04285 19.5209 4.48024C18.9583 3.91763 18.1953 3.60156 17.3996 3.60156H6.59961C5.80396 3.60156 5.0409 3.91763 4.47829 4.48024C3.91568 5.04285 3.59961 5.80591 3.59961 6.60156V17.4016C3.59961 18.1972 3.91568 18.9603 4.47829 19.5229C5.0409 20.0855 5.80396 20.4016 6.59961 20.4016H17.3996C18.1953 20.4016 18.9583 20.0855 19.5209 19.5229C20.0835 18.9603 20.3996 18.1972 20.3996 17.4016V6.60156ZM4.79961 8.40156H19.1996V17.4016C19.1996 17.879 19.01 18.3368 18.6724 18.6744C18.3348 19.0119 17.877 19.2016 17.3996 19.2016H6.59961C6.12222 19.2016 5.66438 19.0119 5.32682 18.6744C4.98925 18.3368 4.79961 17.879 4.79961 17.4016V8.40156ZM6.59961 4.80156H17.3996C17.877 4.80156 18.3348 4.9912 18.6724 5.32877C19.01 5.66634 19.1996 6.12417 19.1996 6.60156V7.20156H4.79961V6.60156C4.79961 6.12417 4.98925 5.66634 5.32682 5.32877C5.66438 4.9912 6.12222 4.80156 6.59961 4.80156Z" fill="black"/>
          </svg>
        );
      case '사용처':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.69413 18.7904C4.27246 18.7904 3.92016 18.6492 3.63721 18.3669C3.35427 18.0845 3.2131 17.7322 3.21371 17.3099V9.95186C2.82688 9.66648 2.54393 9.29217 2.36488 8.82895C2.18582 8.36573 2.18185 7.87164 2.35296 7.3467L3.24488 4.40603C3.3671 4.03203 3.56418 3.7387 3.83613 3.52603C4.10868 3.31336 4.44541 3.20703 4.84629 3.20703H17.1296C17.5299 3.20703 17.8654 3.30664 18.1361 3.50586C18.4062 3.70509 18.6042 3.99323 18.7301 4.37028L19.6569 7.34578C19.8286 7.87134 19.8249 8.3697 19.6459 8.84086C19.4668 9.31203 19.1839 9.69398 18.797 9.9867V17.309C18.797 17.7313 18.6556 18.0836 18.3726 18.3659C18.0897 18.6483 17.7377 18.7898 17.3166 18.7904H4.69413ZM13.022 9.6237C13.6105 9.6237 14.0499 9.4587 14.3402 9.1287C14.6305 8.79931 14.7527 8.45892 14.7069 8.10753L14.0982 4.1237H11.4646V7.9737C11.4646 8.42409 11.6186 8.81153 11.9266 9.13603C12.2346 9.46114 12.5992 9.6237 13.022 9.6237ZM8.89796 9.6237C9.39052 9.6237 9.78866 9.46114 10.0924 9.13603C10.3961 8.81092 10.548 8.42348 10.548 7.9737V4.1237H7.91346L7.30296 8.17811C7.26568 8.46289 7.39004 8.77487 7.67604 9.11403C7.96204 9.4532 8.36996 9.62309 8.89796 9.6237ZM4.81788 9.6237C5.22182 9.6237 5.56527 9.4862 5.84821 9.2112C6.13116 8.9362 6.30716 8.59306 6.37621 8.18178L6.95096 4.1237H4.84629C4.64646 4.1237 4.48757 4.1677 4.36963 4.2557C4.25168 4.3437 4.16368 4.476 4.10563 4.65261L3.25954 7.54745C3.10921 8.029 3.17338 8.49559 3.45204 8.9472C3.73071 9.39881 4.18599 9.62431 4.81788 9.6237ZM17.1929 9.6237C17.7417 9.6237 18.1798 9.40981 18.5074 8.98203C18.8355 8.55425 18.9168 8.07606 18.7512 7.54745L17.8593 4.61778C17.8006 4.44117 17.7123 4.31467 17.5944 4.23828C17.4764 4.16189 17.3178 4.1237 17.1186 4.1237H15.0598L15.6345 8.18178C15.7036 8.59306 15.8796 8.9362 16.1625 9.2112C16.4455 9.4862 16.7889 9.6237 17.1929 9.6237ZM4.69413 17.8737H17.3166C17.481 17.8737 17.6161 17.8208 17.7218 17.7151C17.8275 17.6094 17.8804 17.4743 17.8804 17.3099V10.4239C17.7569 10.4667 17.6396 10.4967 17.5284 10.5138C17.4178 10.5315 17.3059 10.5404 17.1929 10.5404C16.7804 10.5404 16.4174 10.46 16.1039 10.2993C15.7904 10.1386 15.4928 9.88189 15.211 9.52928C14.9715 9.8275 14.676 10.0704 14.3246 10.258C13.9732 10.4456 13.5461 10.5398 13.0431 10.5404C12.6777 10.5404 12.33 10.4551 12 10.2846C11.67 10.1141 11.3384 9.86203 11.0054 9.52836C10.6986 9.86203 10.3585 10.1141 9.98513 10.2846C9.61235 10.4551 9.25668 10.5404 8.91813 10.5404C8.53374 10.5404 8.15913 10.467 7.79429 10.3204C7.42946 10.1737 7.10954 9.9097 6.83454 9.52836C6.38415 9.97875 5.9906 10.2599 5.65388 10.3717C5.31777 10.4841 5.0391 10.5404 4.81788 10.5404C4.70482 10.5404 4.59116 10.5315 4.47688 10.5138C4.36199 10.4961 4.24649 10.4661 4.13038 10.4239V17.309C4.13038 17.474 4.18324 17.6094 4.28896 17.7151C4.39468 17.8208 4.52974 17.8737 4.69413 17.8737Z" fill="black"/>
          </svg>
        );
      default:
        // 기본 편집 아이콘
        return (
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.0625 10.5C17.0625 10.326 17.1316 10.159 17.2547 10.036C17.3778 9.91289 17.5447 9.84375 17.7188 9.84375C17.8928 9.84375 18.0597 9.91289 18.1828 10.036C18.3059 10.159 18.375 10.326 18.375 10.5V17.7188C18.375 17.8928 18.3059 18.0597 18.1828 18.1828C18.0597 18.3059 17.8928 18.375 17.7188 18.375H3.28125C3.1072 18.375 2.94028 18.3059 2.81721 18.1828C2.69414 18.0597 2.625 17.8928 2.625 17.7188V3.28125C2.625 3.1072 2.69414 2.94028 2.81721 2.81721C2.94028 2.69414 3.1072 2.625 3.28125 2.625H10.5C10.674 2.625 10.841 2.69414 10.964 2.81721C11.0871 2.94028 11.1562 3.1072 11.1562 3.28125C11.1562 3.4553 11.0871 3.62222 10.964 3.74529C10.841 3.86836 10.674 3.9375 10.5 3.9375H3.9375V17.0625H17.0625V10.5Z" fill="black"/>
            <path d="M9.6384 11.3665L10.7212 11.2116L17.373 4.5612C17.4356 4.50067 17.4856 4.42825 17.52 4.34819C17.5544 4.26812 17.5725 4.18201 17.5733 4.09487C17.574 4.00774 17.5574 3.92132 17.5244 3.84067C17.4914 3.76002 17.4427 3.68675 17.3811 3.62513C17.3195 3.56352 17.2462 3.51479 17.1656 3.48179C17.0849 3.44879 16.9985 3.43219 16.9114 3.43295C16.8242 3.4337 16.7381 3.45181 16.658 3.4862C16.578 3.52059 16.5056 3.57059 16.445 3.63327L9.79196 10.2837L9.63709 11.3665H9.6384ZM18.3009 2.70402C18.4838 2.88685 18.629 3.10394 18.728 3.34288C18.827 3.58182 18.878 3.83793 18.878 4.09658C18.878 4.35523 18.827 4.61134 18.728 4.85028C18.629 5.08922 18.4838 5.30631 18.3009 5.48914L11.4956 12.2945C11.3952 12.3952 11.2649 12.4606 11.1241 12.4808L8.95852 12.7906C8.8576 12.8051 8.75468 12.7959 8.65794 12.7636C8.5612 12.7314 8.47329 12.6771 8.4012 12.605C8.3291 12.5329 8.27479 12.445 8.24258 12.3483C8.21038 12.2515 8.20115 12.1486 8.21565 12.0477L8.5254 9.88208C8.54529 9.74151 8.61022 9.61118 8.71046 9.51064L15.5171 2.70533C15.8863 2.33625 16.387 2.12891 16.909 2.12891C17.431 2.12891 17.9317 2.33625 18.3009 2.70533V2.70402Z" fill="black"/>
          </svg>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {renderIcon()}
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
  isStatsLoading?: boolean;
}

export default function EventCard({ event, stats, baseUrl, isStatsLoading = false }: EventCardProps) {
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
            {isStatsLoading ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded mb-1"></div>
                  <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded mb-1"></div>
                  <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded mb-1"></div>
                  <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                </div>
              </>
            ) : (
              <>
                <StatItem label="이벤트 참여수" value={stats?.totalInflow || 0} diff={totalInflowDiff} showDiff />
                <StatItem label="쿠폰 발급 수" value={stats?.couponIssued || 0} diff={couponIssuedDiff} showDiff />
                <StatItem label="쿠폰 사용 수" value={stats?.couponUsed || 0} diff={couponUsedDiff} showDiff />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

