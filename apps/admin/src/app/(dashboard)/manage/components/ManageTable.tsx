'use client';

import Link from 'next/link';

type EventStatus = 'all' | 'waiting' | 'ongoing' | 'ended';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  event_info_config?: {
    stores?: Array<{ id?: string; name: string }>;
  } | null;
  created_at: string;
  updated_at: string;
}

interface ManageTableProps {
  filteredEvents: Event[];
  selectedEventIds: Set<string>;
  selectAll: boolean;
  baseUrl: string;
  onSelectAll: () => void;
  onSelectEvent: (eventId: string) => void;
  onOpenQRModal: (event: Event, type?: 'event' | 'store') => void;
}

export default function ManageTable({
  filteredEvents,
  selectedEventIds,
  selectAll,
  baseUrl,
  onSelectAll,
  onSelectEvent,
  onOpenQRModal
}: ManageTableProps) {
  // 이벤트 상태 판단 함수
  const getEventStatus = (event: Event): EventStatus => {
    if (!event.start_date || !event.end_date) return 'waiting';
    
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (now < startDate) return 'waiting';
    if (now > endDate) return 'ended';
    return 'ongoing';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed" style={{ minWidth: '1200px' }}>
          <thead style={{ backgroundColor: '#F3F4F6' }}>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 border-r border-gray-200" style={{ color: '#8F8F8F' }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={onSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap w-1/5" style={{ color: '#8F8F8F' }}>
                이벤트 명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap w-1/6" style={{ color: '#8F8F8F' }}>
                이벤트 기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap w-1/6" style={{ color: '#8F8F8F' }}>
                이벤트 미리보기
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-1/8">
                사용처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-1/8">
                다운로드
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-1/8">
                생성일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap w-1/10" style={{ color: '#8F8F8F' }}>
                이벤트 상태
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider whitespace-nowrap w-1/12" style={{ color: '#8F8F8F' }}>
                수정
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvents.map((event) => {
              const eventUrl = `${baseUrl}/${event.domain_code}`;
              const stores = Array.isArray(event.event_info_config?.stores) 
                ? event.event_info_config.stores.filter((store: any) => store && store.name)
                : [];
              const storeCount = stores.length;
              const eventStatus = getEventStatus(event);
              
              return (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedEventIds.has(event.id)}
                      onChange={() => onSelectEvent(event.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200">
                    <div className="text-sm font-medium text-gray-900 truncate" title={event.name}>
                      {event.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="text-sm text-gray-500">
                      {event.start_date && event.end_date
                        ? `${new Date(event.start_date).toLocaleDateString('ko-KR')} ~ ${new Date(event.end_date).toLocaleDateString('ko-KR')}`
                        : '기간 미설정'}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200">
                    <a
                      href={eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                      title={event.domain_code}
                    >
                      {event.domain_code}
                    </a>
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200">
                    <div className="text-sm text-gray-500 truncate" title={
                      storeCount > 0 ? (
                        storeCount === 1 ? 
                          stores[0]?.name || '사용처 없음' : 
                          `${stores[0]?.name || '사용처'} 외 ${storeCount - 1}곳`
                      ) : '사용처 없음'
                    }>
                      {storeCount > 0 ? (
                        storeCount === 1 ? 
                          stores[0]?.name || '사용처 없음' : 
                          `${stores[0]?.name || '사용처'} 외 ${storeCount - 1}곳`
                      ) : '사용처 없음'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onOpenQRModal(event)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors w-28"
                      >
                        이벤트 QR
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.2199 20.75H5.77994C5.43316 20.7359 5.09256 20.6535 4.77765 20.5075C4.46274 20.3616 4.17969 20.155 3.9447 19.8996C3.70971 19.6442 3.52739 19.3449 3.40818 19.019C3.28896 18.693 3.23519 18.3468 3.24994 18V15C3.24994 14.8011 3.32896 14.6103 3.46961 14.4697C3.61027 14.329 3.80103 14.25 3.99994 14.25C4.19886 14.25 4.38962 14.329 4.53027 14.4697C4.67093 14.6103 4.74994 14.8011 4.74994 15V18C4.72412 18.2969 4.81359 18.5924 4.99977 18.8251C5.18596 19.0579 5.45459 19.21 5.74994 19.25H18.2199C18.5153 19.21 18.7839 19.0579 18.9701 18.8251C19.1563 18.5924 19.2458 18.2969 19.2199 18V15C19.2199 14.8011 19.299 14.6103 19.4396 14.4697C19.5803 14.329 19.771 14.25 19.9699 14.25C20.1689 14.25 20.3596 14.329 20.5003 14.4697C20.6409 14.6103 20.7199 14.8011 20.7199 15V18C20.7499 18.6954 20.504 19.3744 20.0358 19.8894C19.5676 20.4045 18.915 20.7137 18.2199 20.75Z" fill="currentColor"/>
                          <path d="M12.0001 15.7508C11.9016 15.7513 11.8039 15.7321 11.7129 15.6943C11.6219 15.6565 11.5393 15.6009 11.4701 15.5308L7.47009 11.5308C7.33761 11.3886 7.26549 11.2006 7.26892 11.0063C7.27234 10.812 7.35106 10.6266 7.48847 10.4892C7.62588 10.3518 7.81127 10.2731 8.00557 10.2696C8.19987 10.2662 8.38792 10.3383 8.53009 10.4708L12.0001 13.9408L15.4701 10.4708C15.6123 10.3383 15.8003 10.2662 15.9946 10.2696C16.1889 10.2731 16.3743 10.3518 16.5117 10.4892C16.6491 10.6266 16.7278 10.812 16.7313 11.0063C16.7347 11.2006 16.6626 11.3886 16.5301 11.5308L12.5301 15.5308C12.4608 15.6009 12.3783 15.6565 12.2873 15.6943C12.1963 15.7321 12.0986 15.7513 12.0001 15.7508Z" fill="currentColor"/>
                          <path d="M12 15.75C11.8019 15.7474 11.6126 15.6676 11.4725 15.5275C11.3324 15.3874 11.2526 15.1981 11.25 15V4C11.25 3.80109 11.329 3.61032 11.4697 3.46967C11.6103 3.32902 11.8011 3.25 12 3.25C12.1989 3.25 12.3897 3.32902 12.5303 3.46967C12.671 3.61032 12.75 3.80109 12.75 4V15C12.7474 15.1981 12.6676 15.3874 12.5275 15.5275C12.3874 15.6676 12.1981 15.7474 12 15.75Z" fill="currentColor"/>
                        </svg>
                      </button>
                      {storeCount > 0 && (
                        <button
                          onClick={() => onOpenQRModal(event, 'store')}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors w-28"
                        >
                          사용처 QR
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.2199 20.75H5.77994C5.43316 20.7359 5.09256 20.6535 4.77765 20.5075C4.46274 20.3616 4.17969 20.155 3.9447 19.8996C3.70971 19.6442 3.52739 19.3449 3.40818 19.019C3.28896 18.693 3.23519 18.3468 3.24994 18V15C3.24994 14.8011 3.32896 14.6103 3.46961 14.4697C3.61027 14.329 3.80103 14.25 3.99994 14.25C4.19886 14.25 4.38962 14.329 4.53027 14.4697C4.67093 14.6103 4.74994 14.8011 4.74994 15V18C4.72412 18.2969 4.81359 18.5924 4.99977 18.8251C5.18596 19.0579 5.45459 19.21 5.74994 19.25H18.2199C18.5153 19.21 18.7839 19.0579 18.9701 18.8251C19.1563 18.5924 19.2458 18.2969 19.2199 18V15C19.2199 14.8011 19.299 14.6103 19.4396 14.4697C19.5803 14.329 19.771 14.25 19.9699 14.25C20.1689 14.25 20.3596 14.329 20.5003 14.4697C20.6409 14.6103 20.7199 14.8011 20.7199 15V18C20.7499 18.6954 20.504 19.3744 20.0358 19.8894C19.5676 20.4045 18.915 20.7137 18.2199 20.75Z" fill="currentColor"/>
                            <path d="M12.0001 15.7508C11.9016 15.7513 11.8039 15.7321 11.7129 15.6943C11.6219 15.6565 11.5393 15.6009 11.4701 15.5308L7.47009 11.5308C7.33761 11.3886 7.26549 11.2006 7.26892 11.0063C7.27234 10.812 7.35106 10.6266 7.48847 10.4892C7.62588 10.3518 7.81127 10.2731 8.00557 10.2696C8.19987 10.2662 8.38792 10.3383 8.53009 10.4708L12.0001 13.9408L15.4701 10.4708C15.6123 10.3383 15.8003 10.2662 15.9946 10.2696C16.1889 10.2731 16.3743 10.3518 16.5117 10.4892C16.6491 10.6266 16.7278 10.812 16.7313 11.0063C16.7347 11.2006 16.6626 11.3886 16.5301 11.5308L12.5301 15.5308C12.4608 15.6009 12.3783 15.6565 12.2873 15.6943C12.1963 15.7321 12.0986 15.7513 12.0001 15.7508Z" fill="currentColor"/>
                            <path d="M12 15.75C11.8019 15.7474 11.6126 15.6676 11.4725 15.5275C11.3324 15.3874 11.2526 15.1981 11.25 15V4C11.25 3.80109 11.329 3.61032 11.4697 3.46967C11.6103 3.32902 11.8011 3.25 12 3.25C12.1989 3.25 12.3897 3.32902 12.5303 3.46967C12.671 3.61032 12.75 3.80109 12.75 4V15C12.7474 15.1981 12.6676 15.3874 12.5275 15.5275C12.3874 15.6676 12.1981 15.7474 12 15.75Z" fill="currentColor"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: eventStatus === 'waiting' 
                            ? '#FF9945'
                            : eventStatus === 'ongoing'
                            ? '#48CC8E'
                            : '#888888'
                        }}
                      ></div>
                      <span 
                        className="text-sm font-medium"
                        style={{
                          color: eventStatus === 'waiting' 
                            ? '#FF9945'
                            : eventStatus === 'ongoing'
                            ? '#48CC8E'
                            : '#888888'
                        }}
                      >
                        {eventStatus === 'waiting' ? '대기' : eventStatus === 'ongoing' ? '진행중' : '종료'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/create/${event.id}`}
                      className="text-gray-600 hover:text-gray-900"
                      title="수정"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}