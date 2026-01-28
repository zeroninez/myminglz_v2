'use client';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface EventInfoTableProps {
  selectedEvent: string;
  events: Event[];
}

export default function EventInfoTable({ selectedEvent, events }: EventInfoTableProps) {
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

  // 이벤트가 시작되었는지 확인 (시작되지 않은 이벤트 필터링용)
  const isEventStarted = (event: Event) => {
    if (!event.start_date) return false;
    
    const today = new Date();
    const startDate = new Date(event.start_date);
    return startDate <= today;
  };

  // 통계에 표시할 이벤트 목록 (시작된 이벤트만)
  const availableEvents = events.filter(isEventStarted);

  if (selectedEvent === '전체') {
    return null;
  }

  return (
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
  );
}